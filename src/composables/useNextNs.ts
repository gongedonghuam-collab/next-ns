import { ref, computed } from "vue";
import { db, auth } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  increment,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Question, User, StudyLog } from "@/types";

// 保存キーの定義
const STORAGE_KEY_SESSION = "nextns_session_questions";
const STORAGE_KEY_INDEX = "nextns_session_index";
const STORAGE_KEY_PERIOD = "nextns_session_period";
const STORAGE_KEY_MODE = "nextns_session_mode"; // ★追加
const STORAGE_KEY_YEAR = "nextns_session_year"; // ★追加

// --- グローバルステート ---
const currentUser = ref<User | null>(null);
const masterQuestions = ref<Question[]>([]);
const questions = ref<Question[]>([]);
const reviewQuestions = ref<Question[]>([]);
const bookmarkedQuestions = ref<Question[]>([]);
const bookmarkedIds = ref<Set<string>>(new Set());
const studyLogs = ref<StudyLog[]>([]);
const loading = ref(false);

const currentSessionIndex = ref(0);
const selectedPeriod = ref<"all" | "am" | "pm">("all");

// ★追加: 現在のセッション設定を保持するステート
const sessionMode = ref<"random100" | "examYear" | null>(null);
const sessionYear = ref<string | null>(null);

// 結果画面用ステート
const sessionResult = ref<{
  correct: number;
  total: number;
  rate: number;
  judge: string;
  judgeText: string;
} | null>(null);

// ランキングデータ
const rankingList = ref<User[]>([]);

// 最新の学習ログID（AI解説保存用）
const lastLogId = ref<string | null>(null);

// ログから算出する一時的な経験値（表示用）
const totalExp = computed(() =>
  studyLogs.value.reduce((t, log) => t + (log.isCorrect ? 20 : 5), 0)
);

const currentLevel = computed(() => {
  const exp = currentUser.value?.totalExp || totalExp.value;
  return Math.floor(exp / 100) + 1;
});

const levelProgress = computed(() => {
  const exp = currentUser.value?.totalExp || totalExp.value;
  return exp % 100;
});

const currentRank = computed(() => {
  const lv = currentLevel.value;
  if (lv < 5) return "新人ナースの卵";
  if (lv < 10) return "駆け出しナース";
  if (lv < 20) return "中堅ナース";
  return "ベテランナース";
});

const questionStats = computed(() => {
  const stats: Record<string, { am: number; pm: number; total: number }> = {};
  masterQuestions.value.forEach((q) => {
    const year = q.examYear || "不明";
    if (!stats[year]) stats[year] = { am: 0, pm: 0, total: 0 };
    stats[year].total++;
    if (q.questionNumber?.includes("午前")) stats[year].am++;
    else if (q.questionNumber?.includes("午後")) stats[year].pm++;
  });
  return Object.entries(stats)
    .map(([year, data]) => ({ year, ...data }))
    .sort((a, b) => b.year.localeCompare(a.year, undefined, { numeric: true }));
});

const dbHealthReport = computed(() => {
  const report: Record<
    string,
    { missingAm: string[]; missingPm: string[]; duplicates: string[] }
  > = {};
  const grouped = masterQuestions.value.reduce((acc, q) => {
    const key = q.examYear || "不明";
    if (!acc[key]) acc[key] = [];
    acc[key].push(q.questionNumber);
    return acc;
  }, {} as Record<string, string[]>);

  Object.entries(grouped).forEach(([year, nums]) => {
    const am = nums.filter((n) => n.includes("午前"));
    const pm = nums.filter((n) => n.includes("午後"));
    const missingAm = [];
    const missingPm = [];
    for (let i = 1; i <= 120; i++) {
      if (!am.includes(`午前${i}`)) missingAm.push(`午前${i}`);
      if (!pm.includes(`午後${i}`)) missingPm.push(`午後${i}`);
    }
    const duplicates = nums.filter(
      (item, index) => nums.indexOf(item) !== index
    );
    report[year] = {
      missingAm,
      missingPm,
      duplicates: [...new Set(duplicates)],
    };
  });
  return report;
});

export function useNextNs() {
  const aiResponse = ref("");
  const isAiThinking = ref(false);

  // ★修正: モードと年度も保存する
  const saveSession = () => {
    if (questions.value.length > 0) {
      localStorage.setItem(
        STORAGE_KEY_SESSION,
        JSON.stringify(questions.value)
      );
      localStorage.setItem(
        STORAGE_KEY_INDEX,
        String(currentSessionIndex.value)
      );
      localStorage.setItem(STORAGE_KEY_PERIOD, selectedPeriod.value);
      localStorage.setItem(STORAGE_KEY_MODE, sessionMode.value || "");
      localStorage.setItem(STORAGE_KEY_YEAR, sessionYear.value || "");
    }
  };

  // ★修正: モードと年度も復元する
  const restoreSession = () => {
    const saved = localStorage.getItem(STORAGE_KEY_SESSION);
    const idx = localStorage.getItem(STORAGE_KEY_INDEX);
    const prd = localStorage.getItem(STORAGE_KEY_PERIOD);
    const mode = localStorage.getItem(STORAGE_KEY_MODE);
    const year = localStorage.getItem(STORAGE_KEY_YEAR);

    if (saved && idx) {
      try {
        questions.value = JSON.parse(saved);
        currentSessionIndex.value = parseInt(idx, 10);
        if (prd) selectedPeriod.value = prd as any;
        if (mode) sessionMode.value = mode as any;
        if (year) sessionYear.value = year;
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  // ★修正: 完全に消去する
  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_INDEX);
    localStorage.removeItem(STORAGE_KEY_PERIOD);
    localStorage.removeItem(STORAGE_KEY_MODE);
    localStorage.removeItem(STORAGE_KEY_YEAR);
    currentSessionIndex.value = 0;
    sessionMode.value = null;
    sessionYear.value = null;
  };

  const fetchAllQuestions = async () => {
    if (masterQuestions.value.length > 0) return;
    loading.value = true;
    try {
      const q = query(collection(db, "questions"), limit(5000));
      const snap = await getDocs(q);
      masterQuestions.value = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Question)
      );
    } finally {
      loading.value = false;
    }
  };

  const fetchReviewQuestions = async () => {
    if (!currentUser.value) return;
    const q = query(
      collection(db, "study_logs"),
      where("userId", "==", currentUser.value.uid),
      limit(1000)
    );
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => d.data() as StudyLog);
    const reviewMap = new Map<string, Question>();
    logs.sort(
      (a, b) => (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0)
    );
    logs.forEach((log) => {
      if (!log.question?.id) return;
      if (!log.isCorrect || log.confidence !== "ok") {
        reviewMap.set(log.question.id, {
          ...log.question,
          lastResult: {
            isCorrect: log.isCorrect,
            confidence: log.confidence,
            userChoice: log.userChoice,
            aiAdvice: log.aiAdvice,
          },
        });
      } else {
        reviewMap.delete(log.question.id);
      }
    });
    reviewQuestions.value = Array.from(reviewMap.values()).reverse();
  };

  const fetchHistory = async () => {
    if (!currentUser.value) return;
    const q = query(
      collection(db, "study_logs"),
      where("userId", "==", currentUser.value.uid),
      limit(100)
    );
    const snap = await getDocs(q);
    studyLogs.value = snap.docs
      .map(
        (d) =>
          ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          } as StudyLog)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const fetchBookmarks = async () => {
    if (!currentUser.value) return;
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", currentUser.value.uid)
    );
    const snap = await getDocs(q);
    bookmarkedQuestions.value = snap.docs.map(
      (d) => d.data().question as Question
    );
    bookmarkedIds.value = new Set(snap.docs.map((d) => d.data().questionId));
  };

  const toggleBookmark = async (question: Question) => {
    const uid = currentUser.value?.uid;
    if (!uid) return;
    if (bookmarkedIds.value.has(question.id)) {
      bookmarkedIds.value.delete(question.id);
      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", uid),
        where("questionId", "==", question.id)
      );
      const s = await getDocs(q);
      s.forEach((d) => deleteDoc(d.ref));
    } else {
      bookmarkedIds.value.add(question.id);
      await addDoc(collection(db, "bookmarks"), {
        userId: uid,
        questionId: question.id,
        question,
        createdAt: serverTimestamp(),
      });
    }
    await fetchBookmarks();
  };

  const saveAnswer = async (
    q: Question,
    choice: number,
    isCorrect: boolean,
    confidence: any
  ) => {
    const uid = currentUser.value?.uid;
    if (!uid) return;

    q.lastResult = { isCorrect, confidence, userChoice: [choice] };
    saveSession();

    const expGained = isCorrect ? 20 : 5;
    const logRef = await addDoc(collection(db, "study_logs"), {
      userId: uid,
      questionId: q.id,
      question: q,
      userChoice: [choice],
      isCorrect,
      confidence,
      createdAt: serverTimestamp(),
    });

    lastLogId.value = logRef.id;

    try {
      const userRef = doc(db, "users", uid);
      await setDoc(
        userRef,
        {
          email: currentUser.value?.email,
          totalExp: increment(expGained),
          lastActiveAt: serverTimestamp(),
          displayName: currentUser.value?.displayName || null,
          photoURL: currentUser.value?.photoURL || null,
          role: currentUser.value?.role || "student",
        },
        { merge: true }
      );

      if (currentUser.value) {
        currentUser.value.totalExp =
          (currentUser.value.totalExp || 0) + expGained;
      }
    } catch (e) {
      console.error("Exp update failed", e);
    }

    fetchReviewQuestions();
    fetchHistory();
  };

  const goToNext = () => {
    currentSessionIndex.value++;
    aiResponse.value = "";
    lastLogId.value = null;
    saveSession();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ★★★ AI解説リクエスト（完全無料・無制限版） ★★★
  const askAI = async (q: Question): Promise<boolean> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      aiResponse.value = "APIキー未設定";
      return false;
    }
    if (!currentUser.value) return false;

    if (q.lastResult?.aiAdvice) {
      aiResponse.value = q.lastResult.aiAdvice;
      return true;
    }

    isAiThinking.value = true;
    aiResponse.value = "";

    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listResponse = await fetch(listUrl);
      const listData = await listResponse.json();
      const generationModels = (listData.models || []).filter((m: any) =>
        m.supportedGenerationMethods?.includes("generateContent")
      );
      const flash = generationModels.find((m: any) =>
        m.name.includes("gemini-1.5-flash")
      );
      const targetModel = (flash || generationModels[0])?.name.replace(
        "models/",
        ""
      );

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: targetModel });
      const prompt = `あなたは看護学生の学習をサポートする優しい専属チューターです。
      問題「${q.text}」に対し、なぜ正解が ${q.correctIndices.map(
        (i) => i + 1
      )} 番なのか、
      他の選択肢がなぜ間違いなのかを、学生が覚えやすいように噛み砕いて解説してください。
      また、この問題に関連する「重要ポイント」も1つ教えてください。`;

      const res = await model.generateContent(prompt);
      const text = res.response.text();

      isAiThinking.value = false;

      const chars = text.split("");
      for (const char of chars) {
        aiResponse.value += char;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      if (lastLogId.value) {
        await updateDoc(doc(db, "study_logs", lastLogId.value), {
          aiAdvice: text,
        });
      }
      if (q.lastResult) q.lastResult.aiAdvice = text;

      return true;
    } catch (e: any) {
      isAiThinking.value = false;
      aiResponse.value = "AIエラー: " + e.message;
      return true;
    }
  };

  const cleanupDuplicates = async () => {
    if (!confirm("重複を削除しますか？")) return;
    loading.value = true;
    try {
      const seen = new Set();
      const toDeleteIds: string[] = [];
      masterQuestions.value.forEach((q) => {
        const key = `${q.examYear}-${q.questionNumber}`;
        if (seen.has(key)) {
          toDeleteIds.push(q.id);
        } else {
          seen.add(key);
        }
      });
      if (toDeleteIds.length === 0) return;
      for (const id of toDeleteIds) {
        await deleteDoc(doc(db, "questions", id));
      }
      window.location.reload();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  // ★修正: リセット時などにモードや年度が空にならないよう補完
  const fetchQuestions = async (
    options: {
      force?: boolean;
      mode?: "random100" | "examYear";
      year?: string;
      period?: "am" | "pm";
    } = {}
  ) => {
    if (!options.force && restoreSession()) return;

    loading.value = true;
    try {
      await fetchAllQuestions();
      let list = [...masterQuestions.value];

      // 引数で指定があればそれを優先し、なければ保存されたセッション設定を使用
      const activeMode = options.mode || sessionMode.value;
      const activeYear = options.year || sessionYear.value;
      const activePeriod = options.period || selectedPeriod.value;

      // --- フィルタリング処理 ---
      if (activeMode === "examYear" && activeYear) {
        list = list.filter((q) => q.examYear === activeYear);
      }

      if (activePeriod === "am")
        list = list.filter((q) => q.questionNumber?.includes("午前"));
      else if (activePeriod === "pm")
        list = list.filter((q) => q.questionNumber?.includes("午後"));

      if (activeMode === "random100") {
        list.sort(() => Math.random() - 0.5);
        list = list.slice(0, 100);
      } else if (activeMode === "examYear") {
        list.sort((a, b) =>
          a.questionNumber.localeCompare(b.questionNumber, undefined, {
            numeric: true,
          })
        );
      } else {
        list.sort(() => Math.random() - 0.5);
      }

      // --- 状態の更新と保存 ---
      questions.value = list;
      // force=true(新規開始)ならインデックス0、そうでなければ維持
      if (options.force) {
        currentSessionIndex.value = 0;
        // 新しい設定を保存
        sessionMode.value = activeMode || null;
        sessionYear.value = activeYear || null;
      }

      saveSession();
    } finally {
      loading.value = false;
    }
  };

  const fetchRanking = async () => {
    loading.value = true;
    try {
      const q = query(
        collection(db, "users"),
        orderBy("totalExp", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      rankingList.value = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email || "",
          role: data.role || "student",
          createdAt: data.createdAt,
          ...data,
        } as User;
      });
    } catch (e) {
      console.error("Ranking fetch error", e);
    } finally {
      loading.value = false;
    }
  };

  const setSessionResult = (correct: number, total: number) => {
    if (total === 0) return;
    const rate = Math.round((correct / total) * 100);
    let judge = "";
    let judgeText = "";

    if (rate >= 90) {
      judge = "S";
      judgeText = "素晴らしい！完璧に近い仕上がりです✨";
    } else if (rate >= 80) {
      judge = "A";
      judgeText = "合格安全圏です！この調子でいきましょう🌸";
    } else if (rate >= 60) {
      judge = "B";
      judgeText = "合格ライン付近です。苦手分野を見直しましょう💪";
    } else {
      judge = "C";
      judgeText = "要復習です。間違えた問題をしっかり見直しましょう📚";
    }
    sessionResult.value = { correct, total, rate, judge, judgeText };
  };

  const finishSession = () => {
    const total = questions.value.length;
    const correct = questions.value.filter(
      (q) => q.lastResult?.isCorrect
    ).length;
    setSessionResult(correct, total);
  };

  return {
    currentUser,
    masterQuestions,
    questions,
    questionStats,
    dbHealthReport,
    reviewQuestions,
    bookmarkedQuestions,
    bookmarkedIds,
    studyLogs,
    loading,
    totalExp,
    currentLevel,
    levelProgress,
    currentRank,
    selectedPeriod,
    currentSessionIndex,
    aiResponse,
    isAiThinking,
    sessionResult,
    rankingList,
    lastLogId,
    sessionMode, // ★公開
    sessionYear, // ★公開
    initAuth: () =>
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const userData = snap.data();
            currentUser.value = {
              uid: user.uid,
              email: userData.email || user.email || "",
              role: userData.role || "student",
              createdAt: userData.createdAt,
              displayName: userData.displayName,
              photoURL: userData.photoURL,
              totalExp: userData.totalExp || 0,
              lastActiveAt: userData.lastActiveAt,
              isPremium: true,
              aiUsage: { count: 0, lastUsedAt: null },
            } as User;
          } else {
            currentUser.value = {
              uid: user.uid,
              email: user.email || "",
              role: "student",
              createdAt: new Date(),
              totalExp: 0,
              isPremium: true,
              aiUsage: { count: 0, lastUsedAt: null },
            } as User;
          }

          await Promise.all([
            fetchAllQuestions(),
            fetchHistory(),
            fetchReviewQuestions(),
            fetchBookmarks(),
          ]);
        } else {
          currentUser.value = null;
        }
      }),
    fetchQuestions,
    fetchAllQuestions,
    fetchReviewQuestions,
    fetchHistory,
    fetchBookmarks,
    toggleBookmark,
    saveAnswer,
    askAI,
    clearSession,
    goToNext,
    cleanupDuplicates,
    setSessionResult,
    finishSession,
    fetchRanking,
    logout: async () => {
      clearSession();
      await signOut(auth);
      window.location.reload();
    },
  };
}
