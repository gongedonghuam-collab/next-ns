import { ref, computed, watch } from "vue";
import { db, auth } from "@/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import type { Question, User, StudyLog } from "@/types";

// --- ローカルストレージのキー ---
const STORAGE_KEY_SESSION = "nextns_session_questions"; // 問題リスト
const STORAGE_KEY_INDEX = "nextns_session_index"; // ★追加: 何問目まで解いたか

// グローバルステート
const currentUser = ref<User | null>(null);
const questions = ref<Question[]>([]);
const reviewQuestions = ref<Question[]>([]);
const bookmarkedQuestions = ref<Question[]>([]);
const bookmarkedIds = ref<Set<string>>(new Set());
const studyLogs = ref<StudyLog[]>([]);
const loading = ref(false);
const clearedQuestionIds = ref<Set<string>>(new Set());

// ★追加: 現在のセッションでの回答数（Q数カウント用）
const currentSessionIndex = ref(0);

const selectedPeriod = ref<"all" | "am" | "pm">("all");

const todayLogCount = computed(() => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return studyLogs.value.filter((log) => {
    const logDate =
      log.createdAt instanceof Date
        ? log.createdAt
        : (log.createdAt as any)?.toDate
        ? (log.createdAt as any).toDate()
        : new Date(log.createdAt);
    return logDate >= startOfDay;
  }).length;
});

const availableTags = computed(() => {
  const tags = new Set<string>();
  const source = [
    ...questions.value,
    ...reviewQuestions.value,
    ...bookmarkedQuestions.value,
  ];
  source.forEach((q) => {
    if (q.tags && Array.isArray(q.tags)) {
      q.tags.forEach((t) => tags.add(t));
    }
  });
  return Array.from(tags);
});

const totalExp = computed(() => {
  return studyLogs.value.reduce((total, log) => {
    return total + (log.isCorrect ? 20 : 5);
  }, 0);
});

const currentLevel = computed(() => {
  return Math.floor(totalExp.value / 100) + 1;
});

const levelProgress = computed(() => {
  return totalExp.value % 100;
});

const currentRank = computed(() => {
  const lv = currentLevel.value;
  if (lv < 5) return "新人ナースの卵";
  if (lv < 10) return "駆け出しナース";
  if (lv < 20) return "中堅ナース";
  if (lv < 50) return "ベテランナース";
  return "看護師長クラス";
});

export function useNextNs() {
  const aiResponse = ref("");
  const isAiThinking = ref(false);

  // --- 中断セーブ・復帰機能 ---
  const saveSession = () => {
    if (questions.value.length > 0) {
      localStorage.setItem(
        STORAGE_KEY_SESSION,
        JSON.stringify(questions.value)
      );
      // ★現在のカウント数も保存
      localStorage.setItem(
        STORAGE_KEY_INDEX,
        String(currentSessionIndex.value)
      );
    }
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_INDEX);
    questions.value = [];
    currentSessionIndex.value = 0; // リセット
  };

  const restoreSession = () => {
    const savedQuestions = localStorage.getItem(STORAGE_KEY_SESSION);
    const savedIndex = localStorage.getItem(STORAGE_KEY_INDEX);

    if (savedQuestions) {
      try {
        questions.value = JSON.parse(savedQuestions);
        // ★保存されていたカウント数を復元
        if (savedIndex) {
          currentSessionIndex.value = parseInt(savedIndex, 10);
        }
        console.log("🔄 前回のセッションを復元しました");
        return true;
      } catch (e) {
        console.error("セッション復元エラー", e);
        return false;
      }
    }
    return false;
  };

  // --- ブックマーク機能 ---
  const toggleBookmark = async (question: Question) => {
    let userId = currentUser.value?.uid;
    if (!userId) {
      const user = auth.currentUser;
      if (user) {
        userId = user.uid;
        currentUser.value = {
          uid: user.uid,
          email: user.email || "",
          role: "student",
          createdAt: new Date(),
        };
      } else {
        alert("ログインしてください");
        return;
      }
    }

    if (bookmarkedIds.value.has(question.id)) {
      bookmarkedIds.value.delete(question.id);
      bookmarkedQuestions.value = bookmarkedQuestions.value.filter(
        (q) => q.id !== question.id
      );
      try {
        const q = query(
          collection(db, "bookmarks"),
          where("userId", "==", userId),
          where("questionId", "==", question.id)
        );
        const snap = await getDocs(q);
        snap.forEach(async (d) => await deleteDoc(d.ref));
      } catch (e) {
        console.error(e);
      }
    } else {
      bookmarkedIds.value.add(question.id);
      bookmarkedQuestions.value.unshift(question);
      try {
        await addDoc(collection(db, "bookmarks"), {
          userId: userId,
          questionId: question.id,
          question: question,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error(e);
        bookmarkedIds.value.delete(question.id);
      }
    }
  };

  const fetchBookmarks = async () => {
    if (!currentUser.value) return;
    try {
      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", currentUser.value.uid)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({
        ...d.data(),
        createdAt: d.data().createdAt?.toDate
          ? d.data().createdAt.toDate()
          : new Date(),
      }));
      items.sort(
        (a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      const list: Question[] = [];
      const ids = new Set<string>();
      items.forEach((data: any) => {
        if (data.question) {
          list.push(data.question as Question);
          ids.add(data.questionId);
        }
      });
      bookmarkedQuestions.value = list;
      bookmarkedIds.value = ids;
    } catch (e) {
      console.error(e);
    }
  };

  // --- AI機能 ---
  const askAI = async (question: Question, userQuery?: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      aiResponse.value = "⚠️ APIキーが設定されていません。";
      return;
    }
    isAiThinking.value = true;
    aiResponse.value = "";
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const correctNumbers = question.correctIndices
        .map((i) => i + 1)
        .join(", ");
      const prompt = `
        あなたは看護学生の学習をサポートするチューターです。
        【指示】
        1. 「正解は ${correctNumbers} です」から始めてください。
        2. なぜその答えになるのか、重要なキーワードを使って解説してください。
        3. 他の選択肢がなぜ間違いなのか指摘してください。
        【問題】${question.text}
        【選択肢】${question.choices.map((c, i) => `${i + 1}. ${c}`).join("\n")}
        【質問】${userQuery || "解説をお願いします。"}
      `;
      const result = await model.generateContent(prompt);
      aiResponse.value = (await result.response).text();
    } catch (e: any) {
      aiResponse.value = "AIエラー: " + e.message;
    } finally {
      isAiThinking.value = false;
    }
  };

  const initAuth = () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!currentUser.value)
          currentUser.value = {
            uid: user.uid,
            email: user.email || "",
            role: "student",
            createdAt: new Date(),
          } as User;
        await fetchUserProfile(user.uid);
      } else {
        currentUser.value = null;
      }
    });
  };

  const fetchUserProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) currentUser.value = { uid, ...snap.data() } as User;
      else
        await setDoc(
          doc(db, "users", uid),
          {
            uid,
            email: auth.currentUser?.email,
            role: "student",
            createdAt: new Date(),
          },
          { merge: true }
        );
      await Promise.all([
        fetchHistory(),
        fetchReviewQuestions(),
        fetchBookmarks(),
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  // --- 回答保存 ---
  const saveAnswer = async (
    question: Question,
    choiceIndex: number,
    isCorrect: boolean,
    confidence?: "ok" | "so-so" | "ng"
  ) => {
    let userId = currentUser.value?.uid;
    if (!userId && auth.currentUser) userId = auth.currentUser.uid;
    if (!userId) return;

    const newLog: StudyLog = {
      id: "temp_" + Date.now(),
      userId,
      questionId: question.id,
      question,
      userChoice: [choiceIndex],
      isCorrect,
      timeTaken: 10,
      createdAt: new Date(),
      confidence,
    };
    studyLogs.value.unshift(newLog);

    if (!isCorrect || confidence === "so-so" || confidence === "ng") {
      const existingIdx = reviewQuestions.value.findIndex(
        (q) => q.id === question.id
      );
      const updatedQ = {
        ...question,
        lastResult: { isCorrect, confidence, userChoice: [choiceIndex] },
      };
      if (existingIdx !== -1) reviewQuestions.value.splice(existingIdx, 1);
      reviewQuestions.value.unshift(updatedQ);
      clearedQuestionIds.value.delete(question.id);
    } else {
      if (reviewQuestions.value.some((q) => q.id === question.id))
        clearedQuestionIds.value.add(question.id);
    }

    // ★演習モードの進捗管理
    const qIndex = questions.value.findIndex((q) => q.id === question.id);
    if (qIndex !== -1) {
      questions.value.splice(qIndex, 1); // リストから削除
      currentSessionIndex.value++; // ★カウントアップ
      saveSession(); // 状態保存
    }

    try {
      await addDoc(collection(db, "study_logs"), {
        userId,
        questionId: question.id,
        question,
        userChoice: [choiceIndex],
        isCorrect,
        timeTaken: 10,
        confidence: confidence || null,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    if (!currentUser.value) return;
    try {
      const q = query(
        collection(db, "study_logs"),
        where("userId", "==", currentUser.value.uid),
        limit(100)
      );
      const snap = await getDocs(q);
      const logs = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate
              ? d.data().createdAt.toDate()
              : new Date(),
          } as StudyLog)
      );
      studyLogs.value = logs.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReviewQuestions = async () => {
    if (!currentUser.value) return;
    try {
      clearedQuestionIds.value.clear();
      const q = query(
        collection(db, "study_logs"),
        where("userId", "==", currentUser.value.uid),
        limit(300)
      );
      const snap = await getDocs(q);
      const logs = snap.docs.map((d) => d.data() as StudyLog);
      logs.sort(
        (a: any, b: any) =>
          a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime()
      );

      const reviewMap = new Map<string, Question>();
      logs.forEach((log) => {
        if (log.question?.id) {
          if (
            !log.isCorrect ||
            log.confidence === "so-so" ||
            log.confidence === "ng"
          ) {
            reviewMap.set(log.question.id, {
              ...log.question,
              lastResult: {
                isCorrect: log.isCorrect,
                confidence: log.confidence,
              },
            });
          } else if (log.isCorrect && log.confidence === "ok") {
            reviewMap.delete(log.question.id);
          }
        }
      });
      reviewQuestions.value = Array.from(reviewMap.values()).reverse();
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    clearSession();
    await signOut(auth);
    window.location.reload();
  };

  // --- 問題取得（フィルター対応） ---
  const fetchQuestions = async (forceRefresh = false) => {
    if (!forceRefresh && questions.value.length > 0) return;
    if (!forceRefresh && restoreSession()) return; // 復元できたら終了

    loading.value = true;
    try {
      const q = query(collection(db, "questions"), limit(1000));
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question));

      if (selectedPeriod.value === "am") {
        list = list.filter((q) => q.questionNumber.includes("午前"));
      } else if (selectedPeriod.value === "pm") {
        list = list.filter((q) => q.questionNumber.includes("午後"));
      }

      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }

      questions.value = list;
      currentSessionIndex.value = 0; // ★新規取得時はカウントリセット
      saveSession();
    } catch (e) {
      console.error("問題取得エラー:", e);
    } finally {
      loading.value = false;
    }
  };

  watch(selectedPeriod, () => {
    clearSession();
    fetchQuestions(true);
  });

  return {
    currentUser,
    questions,
    reviewQuestions,
    clearedQuestionIds,
    bookmarkedQuestions,
    bookmarkedIds,
    studyLogs,
    loading,
    todayLogCount,
    availableTags,
    aiResponse,
    isAiThinking,
    totalExp,
    currentLevel,
    levelProgress,
    currentRank,
    selectedPeriod,
    currentSessionIndex, // ★公開: UI側で使う
    askAI,
    initAuth,
    logout,
    fetchQuestions,
    fetchHistory,
    fetchReviewQuestions,
    fetchBookmarks,
    toggleBookmark,
    saveAnswer,
    clearSession,
  };
}
