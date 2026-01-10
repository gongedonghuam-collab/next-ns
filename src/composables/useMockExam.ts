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
  where, // ★追加
} from "firebase/firestore";
import type { Question } from "@/types";

// 模試データの型定義
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

// ユーザーの回答データの型定義
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

  // ★追加: 模試リスト全体（履歴用）
  const examList = ref<MockExam[]>([]);

  // ★追加: 現在の回答者数
  const currentAnswerCount = ref(0);

  // --------------------------------------------------
  // ★新機能: 全ての模試を取得する関数 (履歴リスト用)
  // --------------------------------------------------
  const fetchAllExams = async () => {
    loading.value = true;
    try {
      // 作成日順（新しい順）で取得
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
          // Firestore Timestamp を Date オブジェクトに変換
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

  // --------------------------------------------------
  // ★新機能: 特定の模試の「結果(submission)」を取得する関数
  // --------------------------------------------------
  const fetchUserSubmission = async (examId: string, userId: string) => {
    // ローディングはUI側で制御したい場合もあるため、ここではfalseにしない限り維持するか、
    // 必要に応じて loading.value = true を入れてください。
    // 今回は画面遷移時のちらつき防止のため非同期処理のみ記述します。
    try {
      const subRef = doc(db, "mock_exams", examId, "submissions", userId);
      const subSnap = await getDoc(subRef);

      if (subSnap.exists()) {
        userSubmission.value = subSnap.data() as MockSubmission;
      } else {
        userSubmission.value = null; // 未受験
      }
    } catch (e) {
      console.error("回答データの取得に失敗:", e);
      userSubmission.value = null;
    }
  };

  // 1. 最新の模試情報を取得（既存機能互換）
  // ※ fetchAllExams を使う場合は不要になりますが、既存ロジック維持のため残しています
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

        // ログインユーザーの回答状況を取得
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

  // 2. 問題ロード
  const loadExamQuestions = async () => {
    if (!activeExam.value) return;
    loading.value = true;
    const list: Question[] = [];
    // 問題ID配列から個別に取得（Firestoreの読み取り回数に注意）
    for (const qId of activeExam.value.questionIds) {
      const snap = await getDoc(doc(db, "questions", qId));
      if (snap.exists()) {
        list.push({ id: snap.id, ...snap.data() } as Question);
      }
    }
    examQuestions.value = list;
    loading.value = false;
  };

  // 3. 提出
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
          if (q.type === "mandatory") {
            mandatoryScore++;
          } else {
            generalScore++;
          }
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

      // ローカルのstateも更新（日付は現在時刻で仮置き）
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

  // 4. 新規模試作成
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
      await fetchAllExams(); // リストを再取得
    } catch (e: any) {
      alert("作成失敗: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  // 5. 集計ロジック
  const closeAndReleaseExam = async (examId: string) => {
    if (
      !confirm(
        "回答を締め切って集計しますか？\n実際の国試基準（必修8割・一般相対評価）で判定します。"
      )
    )
      return;

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

      // 問題の配点計算
      for (const qId of qIds) {
        const qSnap = await getDoc(doc(db, "questions", qId));
        if (qSnap.exists()) {
          const qData = qSnap.data();
          if (qData.type === "mandatory") mandatoryMax++;
          else generalMax++;
        }
      }

      const mandatoryBorder = Math.ceil(mandatoryMax * 0.8);

      // 一般問題のボーダー計算（下位10%ライン）
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

      alert(
        `集計完了！\n参加者: ${totalParticipants}人\n必修ボーダー: ${mandatoryBorder}点\n一般ボーダー: ${generalBorder}点`
      );
      await fetchAllExams(); // 更新情報を反映
    } catch (e: any) {
      alert("集計エラー: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  // 6. 模試削除機能
  const deleteMockExam = async (examId: string) => {
    if (
      !confirm(
        "本当にこの模試を削除しますか？\n回答データも全てアクセスできなくなります。"
      )
    )
      return;

    loading.value = true;
    try {
      await deleteDoc(doc(db, "mock_exams", examId));
      alert("削除しました");
      activeExam.value = null;
      await fetchAllExams(); // リスト更新
    } catch (e: any) {
      alert("削除エラー: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  // ★追加: 現在の回答数を取得する関数
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
    examList, // ★export
    userSubmission,
    examQuestions,
    currentAnswerCount,
    fetchAllExams, // ★export
    fetchUserSubmission, // ★export
    fetchLatestExam,
    loadExamQuestions,
    submitExam,
    createMockExam,
    closeAndReleaseExam,
    deleteMockExam,
    fetchAnswerCount,
  };
}
