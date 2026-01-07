import { ref } from "vue";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  limit,
} from "firebase/firestore";
import type { Question } from "@/types";

// 模試データの型定義
export interface MockExam {
  id: string;
  title: string; // 例: 第1回 全国模試
  status: "active" | "closed" | "released"; // 開催中 | 集計中 | 結果公開
  questionIds: string[]; // 出題される30問のID
  deadline: any; // 終了日時
  stats?: {
    // 集計結果
    average: number;
    borderScore: number;
    totalParticipants: number;
  };
}

// ユーザーの回答データの型定義
export interface MockSubmission {
  userId: string;
  userAnswers: number[]; // 選んだ選択肢のインデックス配列
  score: number; // 素点
  submittedAt: any;
}

export function useMockExam() {
  const loading = ref(false);
  const activeExam = ref<MockExam | null>(null); // 現在開催中or最新の模試
  const userSubmission = ref<MockSubmission | null>(null); // ログインユーザーの回答
  const examQuestions = ref<Question[]>([]); // 模試の問題文データ

  // 1. 最新の模試情報を取得
  const fetchLatestExam = async (userId?: string) => {
    loading.value = true;
    try {
      // 作成日が新しい順に1件取得
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
          // FirestoreのTimestampをDateに変換して扱いやすくする
          deadline: docData.deadline?.toDate
            ? docData.deadline.toDate()
            : new Date(docData.deadline),
        } as MockExam;

        // ユーザーがログインしていれば、提出済みかどうか確認
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

  // 2. 模試の問題データを読み込む（受験開始時）
  const loadExamQuestions = async () => {
    if (!activeExam.value) return;
    loading.value = true;
    const list: Question[] = [];

    // questionIds に含まれるIDの問題を1つずつ取得
    // ※本番環境で何千人も同時接続する場合は、問題をsubcollectionにコピーしておく設計の方が良いですが、
    // 個人開発規模ならこの「参照方式」で十分機能します。
    for (const qId of activeExam.value.questionIds) {
      const snap = await getDoc(doc(db, "questions", qId));
      if (snap.exists()) {
        list.push({ id: snap.id, ...snap.data() } as Question);
      }
    }
    examQuestions.value = list;
    loading.value = false;
  };

  // 3. 回答を提出する
  const submitExam = async (
    userId: string,
    answers: number[],
    questions: Question[]
  ) => {
    if (!activeExam.value) return;
    loading.value = true;

    try {
      // 自動採点（素点計算）
      let score = 0;
      questions.forEach((q, index) => {
        // ユーザーの回答と正解が一致していれば加点
        // (複数選択肢の場合はロジック調整が必要ですが、今回は単一回答前提)
        if (q.correctIndices.includes(answers[index])) {
          score++;
        }
      });

      // サブコレクションに保存
      await setDoc(
        doc(db, "mock_exams", activeExam.value.id, "submissions", userId),
        {
          userId,
          userAnswers: answers,
          score,
          submittedAt: serverTimestamp(),
        }
      );

      // ローカルの状態も更新
      userSubmission.value = {
        userId,
        userAnswers: answers,
        score,
        submittedAt: new Date(),
      };

      alert("提出が完了しました！\nお疲れ様でした。");
    } catch (e: any) {
      alert("提出に失敗しました: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  // 4. 【管理者機能】模試を作成する
  const createMockExam = async (
    title: string,
    daysLater: number,
    allQuestions: Question[]
  ) => {
    if (allQuestions.length < 30) {
      alert("問題数が足りません（最低30問必要です）");
      return;
    }
    loading.value = true;
    try {
      // 全問題からランダムに30問選ぶ
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 30);
      const qIds = selected.map((q) => q.id);

      // 締め切り日計算
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
      // 最新情報を再取得
      await fetchLatestExam();
    } catch (e: any) {
      alert("作成失敗: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  // 5. 【管理者機能】集計して公開する
  const closeAndReleaseExam = async (examId: string) => {
    if (
      !confirm(
        "回答を締め切って集計しますか？\nこの操作を行うとユーザーに結果が公開されます。"
      )
    )
      return;

    loading.value = true;
    try {
      // 全員の回答を取得
      const subCol = collection(db, "mock_exams", examId, "submissions");
      const snap = await getDocs(subCol);
      const submissions = snap.docs.map((d) => d.data() as MockSubmission);

      const totalParticipants = submissions.length;
      if (totalParticipants === 0)
        throw new Error("回答者が0人のため集計できません");

      // 平均点を計算
      const totalScore = submissions.reduce((sum, s) => sum + s.score, 0);
      const average = Math.round((totalScore / totalParticipants) * 10) / 10;

      // ボーダーライン設定 (平均点 - 10% などを合格ラインとするなど、ここは自由に調整)
      // 今回は「平均点」をそのまま合格ラインとします
      const borderScore = Math.floor(average);

      // 本体ドキュメントを更新
      await updateDoc(doc(db, "mock_exams", examId), {
        status: "released", // 公開状態へ
        stats: {
          average,
          borderScore,
          totalParticipants,
          maxScore: 30,
        },
      });

      alert("集計完了！結果を公開しました。");
      await fetchLatestExam(); // 画面更新
    } catch (e: any) {
      alert("集計エラー: " + e.message);
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
  };
}
