// src/composables/useMockExam.ts
import { ref } from "vue";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  limit,
  getCountFromServer,
} from "firebase/firestore";
import type { Question } from "@/types";

// 親データ解決用に useNextNs のロジックだけ借りたいが、
// 依存関係をシンプルにするため、ここでも同じロジックを実装します。
const resolveParentsLocal = async (targetQuestions: Question[]) => {
  const hasParent = targetQuestions.filter((q) => q.parentId);
  if (hasParent.length === 0) return;

  const parentIds = [...new Set(hasParent.map((q) => q.parentId!))];
  const parentMap = new Map<string, Question>();

  // DBから取得
  await Promise.all(
    parentIds.map(async (pid) => {
      try {
        const snap = await getDoc(doc(db, "questions", pid));
        if (snap.exists()) {
          parentMap.set(pid, { id: snap.id, ...snap.data() } as Question);
        }
      } catch (e) {
        console.error("Parent fetch error:", pid, e);
      }
    })
  );

  targetQuestions.forEach((q) => {
    if (q.parentId && parentMap.has(q.parentId)) {
      q.parentData = parentMap.get(q.parentId);
    }
  });
};

export interface MockExam {
  id: string;
  title: string;
  status: "active" | "closed" | "released";
  questionIds: string[];
  deadline: any;
  createdAt: any;
  stats?: {
    totalParticipants: number;
    mandatoryMax: number;
    mandatoryBorder: number;
    generalMax: number;
    generalBorder: number;
    generalAverage: number;
  };
}

export interface MockSubmission {
  userId: string;
  userAnswers: number[];
  score: number;
  mandatoryScore: number;
  generalScore: number;
  submittedAt: any;
}

export function useMockExam() {
  const loading = ref(false);
  const activeExam = ref<MockExam | null>(null);
  const userSubmission = ref<MockSubmission | null>(null);
  const examQuestions = ref<Question[]>([]);
  const examList = ref<MockExam[]>([]);
  const currentAnswerCount = ref(0);

  const fetchAllExams = async () => {
    loading.value = true;
    try {
      const q = query(
        collection(db, "mock_exams"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          deadline: data.deadline?.toDate
            ? data.deadline.toDate()
            : new Date(data.deadline),
        };
      }) as MockExam[];
      examList.value = list;
    } catch (e) {
      console.error("模試一覧の取得に失敗:", e);
    } finally {
      loading.value = false;
    }
  };

  const fetchUserSubmission = async (examId: string, userId: string) => {
    try {
      const subRef = doc(db, "mock_exams", examId, "submissions", userId);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        userSubmission.value = subSnap.data() as MockSubmission;
      } else {
        userSubmission.value = null;
      }
    } catch (e) {
      console.error("回答データの取得に失敗:", e);
      userSubmission.value = null;
    }
  };

  const fetchLatestExam = async (userId?: string) => {
    loading.value = true;
    try {
      const q = query(
        collection(db, "mock_exams"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0].data();
        activeExam.value = {
          id: snap.docs[0].id,
          ...docData,
          deadline: docData.deadline?.toDate
            ? docData.deadline.toDate()
            : new Date(docData.deadline),
        } as MockExam;
        if (userId) {
          await fetchUserSubmission(activeExam.value.id, userId);
        }
      } else {
        activeExam.value = null;
      }
    } catch (e) {
      console.error("模試取得エラー", e);
    } finally {
      loading.value = false;
    }
  };

  // ★修正: 問題ロード時に親データを結合する
  const loadExamQuestions = async () => {
    if (!activeExam.value) return;
    loading.value = true;
    const list: Question[] = [];

    // 問題IDからデータを取得
    for (const qId of activeExam.value.questionIds) {
      const snap = await getDoc(doc(db, "questions", qId));
      if (snap.exists()) {
        list.push({ id: snap.id, ...snap.data() } as Question);
      }
    }

    // ★ここで親データを解決
    await resolveParentsLocal(list);

    examQuestions.value = list;
    loading.value = false;
  };

  const submitExam = async (
    userId: string,
    answers: number[],
    questions: Question[]
  ) => {
    if (!activeExam.value) return;
    loading.value = true;
    try {
      let totalScore = 0;
      let mandatoryScore = 0;
      let generalScore = 0;
      questions.forEach((q, index) => {
        const isCorrect = q.correctIndices.includes(answers[index]);
        if (isCorrect) {
          totalScore++;
          if (q.type === "mandatory") mandatoryScore++;
          else generalScore++;
        }
      });
      const submissionData = {
        userId,
        userAnswers: answers,
        score: totalScore,
        mandatoryScore,
        generalScore,
        submittedAt: serverTimestamp(),
      };
      await setDoc(
        doc(db, "mock_exams", activeExam.value.id, "submissions", userId),
        submissionData
      );
      userSubmission.value = {
        ...submissionData,
        submittedAt: new Date(),
      };
      alert("提出が完了しました！\nお疲れ様でした。");
    } catch (e: any) {
      alert("提出に失敗しました: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  const createMockExam = async (
    title: string,
    daysLater: number,
    allQuestions: Question[]
  ) => {
    if (allQuestions.length < 30) {
      alert("問題数が足りません");
      return;
    }
    loading.value = true;
    try {
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 30);
      const qIds = selected.map((q) => q.id);
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + daysLater);
      await setDoc(doc(collection(db, "mock_exams")), {
        title,
        status: "active",
        questionIds: qIds,
        deadline: deadline,
        createdAt: serverTimestamp(),
      });
      alert(`「${title}」を作成しました！`);
      await fetchAllExams();
    } catch (e: any) {
      alert("作成失敗: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  const closeAndReleaseExam = async (examId: string) => {
    if (!confirm("回答を締め切って集計しますか？")) return;
    loading.value = true;
    try {
      const subCol = collection(db, "mock_exams", examId, "submissions");
      const snap = await getDocs(subCol);
      const submissions = snap.docs.map((d) => d.data() as MockSubmission);
      const totalParticipants = submissions.length;
      if (totalParticipants === 0) throw new Error("回答者が0人です");

      const examDoc = await getDoc(doc(db, "mock_exams", examId));
      const qIds = examDoc.data()?.questionIds || [];

      let mandatoryMax = 0;
      let generalMax = 0;
      for (const qId of qIds) {
        const qSnap = await getDoc(doc(db, "questions", qId));
        if (qSnap.exists()) {
          const qData = qSnap.data();
          if (qData.type === "mandatory") mandatoryMax++;
          else generalMax++;
        }
      }

      const mandatoryBorder = Math.ceil(mandatoryMax * 0.8);
      const sortedGeneralScores = submissions
        .map((s) => s.generalScore)
        .sort((a, b) => b - a);
      const borderIndex = Math.floor(totalParticipants * 0.9) - 1;
      const safeBorderIndex = Math.max(0, borderIndex);
      const generalBorder = sortedGeneralScores[safeBorderIndex];
      const totalGeneral = submissions.reduce(
        (sum, s) => sum + s.generalScore,
        0
      );
      const generalAverage =
        Math.round((totalGeneral / totalParticipants) * 10) / 10;

      await updateDoc(doc(db, "mock_exams", examId), {
        status: "released",
        stats: {
          totalParticipants,
          mandatoryMax,
          mandatoryBorder,
          generalMax,
          generalBorder,
          generalAverage,
        },
      });
      alert("集計完了！");
      await fetchAllExams();
    } catch (e: any) {
      alert("集計エラー: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  const deleteMockExam = async (examId: string) => {
    if (!confirm("本当に削除しますか？")) return;
    loading.value = true;
    try {
      await deleteDoc(doc(db, "mock_exams", examId));
      alert("削除しました");
      activeExam.value = null;
      await fetchAllExams();
    } catch (e: any) {
      alert("削除エラー: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  const fetchAnswerCount = async (examId: string) => {
    try {
      const coll = collection(db, "mock_exams", examId, "submissions");
      const snapshot = await getCountFromServer(coll);
      currentAnswerCount.value = snapshot.data().count;
    } catch (e) {
      console.error("回答数取得エラー", e);
    }
  };

  return {
    loading,
    activeExam,
    examList,
    userSubmission,
    examQuestions,
    currentAnswerCount,
    fetchAllExams,
    fetchUserSubmission,
    fetchLatestExam,
    loadExamQuestions,
    submitExam,
    createMockExam,
    closeAndReleaseExam,
    deleteMockExam,
    fetchAnswerCount,
  };
}
