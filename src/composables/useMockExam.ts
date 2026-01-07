import { ref } from "vue";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc, // ★ 追加
  query,
  orderBy,
  serverTimestamp,
  limit,
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
  // ★ 統計データを国試用に詳細化
  stats?: {
    totalParticipants: number;
    // 必修問題
    mandatoryMax: number; // 満点
    mandatoryBorder: number; // 合格ライン(80%)
    // 一般+状況設定問題
    generalMax: number; // 満点
    generalBorder: number; // 合格ライン(相対評価)
    generalAverage: number; // 平均点
  };
}

// ユーザーの回答データの型定義
export interface MockSubmission {
  userId: string;
  userAnswers: number[];
  score: number; // 総合点
  mandatoryScore: number; // ★追加: 必修の得点
  generalScore: number; // ★追加: 一般+状況の得点
  submittedAt: any;
}

export function useMockExam() {
  const loading = ref(false);
  const activeExam = ref<MockExam | null>(null);
  const userSubmission = ref<MockSubmission | null>(null);
  const examQuestions = ref<Question[]>([]);

  // 1. 最新の模試情報を取得
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
          const subRef = doc(
            db,
            "mock_exams",
            activeExam.value.id,
            "submissions",
            userId
          );
          const subSnap = await getDoc(subRef);
          if (subSnap.exists()) {
            userSubmission.value = subSnap.data() as MockSubmission;
          } else {
            userSubmission.value = null;
          }
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
    for (const qId of activeExam.value.questionIds) {
      const snap = await getDoc(doc(db, "questions", qId));
      if (snap.exists()) {
        list.push({ id: snap.id, ...snap.data() } as Question);
      }
    }
    examQuestions.value = list;
    loading.value = false;
  };

  // 3. 提出 (点数を種別ごとに集計して保存)
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
        // 正解しているか
        const isCorrect = q.correctIndices.includes(answers[index]);
        if (isCorrect) {
          totalScore++;
          // 問題タイプで振り分け
          if (q.type === "mandatory") {
            mandatoryScore++;
          } else {
            generalScore++; // 一般 or 状況設定
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

      // Firestore保存
      await setDoc(
        doc(db, "mock_exams", activeExam.value.id, "submissions", userId),
        submissionData
      );

      // ローカル更新
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
      await fetchLatestExam();
    } catch (e: any) {
      alert("作成失敗: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  // 5. ★★★ 集計ロジック（国試仕様） ★★★
  const closeAndReleaseExam = async (examId: string) => {
    if (
      !confirm(
        "回答を締め切って集計しますか？\n実際の国試基準（必修8割・一般相対評価）で判定します。"
      )
    )
      return;

    loading.value = true;
    try {
      // 1. 全回答を取得
      const subCol = collection(db, "mock_exams", examId, "submissions");
      const snap = await getDocs(subCol);
      const submissions = snap.docs.map((d) => d.data() as MockSubmission);

      const totalParticipants = submissions.length;
      if (totalParticipants === 0) throw new Error("回答者が0人です");

      // 2. 問題情報を再取得して配点を計算（満点を出すため）
      const examDoc = await getDoc(doc(db, "mock_exams", examId));
      const qIds = examDoc.data()?.questionIds || [];

      let mandatoryMax = 0;
      let generalMax = 0;

      // 30問分のデータを取得して満点を計算
      for (const qId of qIds) {
        const qSnap = await getDoc(doc(db, "questions", qId));
        if (qSnap.exists()) {
          const qData = qSnap.data();
          if (qData.type === "mandatory") mandatoryMax++;
          else generalMax++;
        }
      }

      // 3. 【必修】ボーダー計算（絶対評価 80%）
      const mandatoryBorder = Math.ceil(mandatoryMax * 0.8);

      // 4. 【一般】ボーダー計算（相対評価 合格率約90%ライン）
      // 一般スコアだけで降順ソート
      const sortedGeneralScores = submissions
        .map((s) => s.generalScore)
        .sort((a, b) => b - a);

      // 上位90%のラインを計算
      // 例: 100人いたら90番目の人の点数がボーダー
      // もし人数が少なすぎる場合は、平均点などを代用する安全策も考慮できますが、
      // 今回は厳密に「下位10%切り捨て」ロジックで実装します。
      const borderIndex = Math.floor(totalParticipants * 0.9) - 1;
      const safeBorderIndex = Math.max(0, borderIndex); // インデックスが負にならないよう調整

      const generalBorder = sortedGeneralScores[safeBorderIndex];

      // 一般の平均点（参考用）
      const totalGeneral = submissions.reduce(
        (sum, s) => sum + s.generalScore,
        0
      );
      const generalAverage =
        Math.round((totalGeneral / totalParticipants) * 10) / 10;

      // 5. 保存
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
      await fetchLatestExam();
    } catch (e: any) {
      alert("集計エラー: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  // ★★★ 6. 追加: 模試削除機能 ★★★
  const deleteMockExam = async (examId: string) => {
    if (
      !confirm(
        "本当にこの模試を削除しますか？\n回答データも全てアクセスできなくなります。"
      )
    )
      return;

    loading.value = true;
    try {
      // サブコレクションの削除はクライアントSDKからは原則1つずつ消す必要があるが、
      // 親ドキュメントを消せばアプリ上からは見えなくなるので今回は親のみ削除
      // (厳密にはCloud Functions等でサブコレクションも消すのがベスト)
      await deleteDoc(doc(db, "mock_exams", examId));
      alert("削除しました");
      activeExam.value = null; // 画面表示をクリア
      await fetchLatestExam(); // 最新状態（もし他にあれば）を取得
    } catch (e: any) {
      alert("削除エラー: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    activeExam,
    userSubmission,
    examQuestions,
    fetchLatestExam,
    loadExamQuestions,
    submitExam,
    createMockExam,
    closeAndReleaseExam,
    deleteMockExam, // ★ エクスポート追加
  };
}
