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
import type { Question, User, StudyLog } from "@/types";

const STORAGE_KEY_SESSION = "nextns_session_questions";
const STORAGE_KEY_INDEX = "nextns_session_index";
const STORAGE_KEY_PERIOD = "nextns_session_period";

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

const totalExp = computed(() =>
  studyLogs.value.reduce((t, log) => t + (log.isCorrect ? 20 : 5), 0)
);
const currentLevel = computed(() => Math.floor(totalExp.value / 100) + 1);
const levelProgress = computed(() => totalExp.value % 100);
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

export function useNextNs() {
  const aiResponse = ref("");
  const isAiThinking = ref(false);

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
    }
  };

  const restoreSession = () => {
    const saved = localStorage.getItem(STORAGE_KEY_SESSION);
    const idx = localStorage.getItem(STORAGE_KEY_INDEX);
    const prd = localStorage.getItem(STORAGE_KEY_PERIOD);
    if (saved && idx) {
      try {
        questions.value = JSON.parse(saved);
        currentSessionIndex.value = parseInt(idx, 10);
        if (prd) selectedPeriod.value = prd as any;
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_INDEX);
    localStorage.removeItem(STORAGE_KEY_PERIOD);
    currentSessionIndex.value = 0;
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
          lastResult: { isCorrect: log.isCorrect, confidence: log.confidence },
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
    await addDoc(collection(db, "study_logs"), {
      userId: uid,
      questionId: q.id,
      question: q,
      userChoice: [choice],
      isCorrect,
      confidence,
      createdAt: serverTimestamp(),
    });
    await Promise.all([fetchReviewQuestions(), fetchHistory()]);
  };

  const goToNext = () => {
    currentSessionIndex.value++;
    saveSession();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const askAI = async (q: Question) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return (aiResponse.value = "APIキー未設定");
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
      const prompt = `あなたは看護学生の学習をサポートするチューターです。「正解は ${q.correctIndices.map(
        (i) => i + 1
      )} です」から始めて、問題 「${q.text}」 を詳しく解説してください。`;
      const res = await model.generateContent(prompt);
      aiResponse.value = res.response.text();
    } catch (e: any) {
      aiResponse.value = "AIエラー: " + e.message;
    } finally {
      isAiThinking.value = false;
    }
  };

  // --- ★ 演習モードの拡張 (午前・午後対応) ---
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

      // 試験回指定フィルタ
      if (options.mode === "examYear" && options.year) {
        list = list.filter((q) => q.examYear === options.year);
      }

      // 時間帯フィルタ (引数優先、なければグローバル設定)
      const activePeriod = options.period || selectedPeriod.value;
      if (activePeriod === "am")
        list = list.filter((q) => q.questionNumber?.includes("午前"));
      else if (activePeriod === "pm")
        list = list.filter((q) => q.questionNumber?.includes("午後"));

      if (options.mode === "random100") {
        list.sort(() => Math.random() - 0.5);
        list = list.slice(0, 100);
      } else if (options.mode === "examYear") {
        // 回指定の場合は問題番号順
        list.sort((a, b) =>
          a.questionNumber.localeCompare(b.questionNumber, undefined, {
            numeric: true,
          })
        );
      } else {
        // デフォルト：全件ランダム
        list.sort(() => Math.random() - 0.5);
      }

      questions.value = list;
      currentSessionIndex.value = 0;
      saveSession();
    } finally {
      loading.value = false;
    }
  };

  return {
    currentUser,
    masterQuestions,
    questions,
    questionStats,
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
    initAuth: () =>
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const snap = await getDoc(doc(db, "users", user.uid));
          currentUser.value = { uid: user.uid, ...snap.data() } as User;
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
    logout: async () => {
      clearSession();
      await signOut(auth);
      window.location.reload();
    },
  };
}
