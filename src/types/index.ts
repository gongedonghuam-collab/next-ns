/**
 * NextNs (NurseCode) Type Definitions
 * 看護師国試アプリ専用のデータ設計図
 */

// 1. ユーザー情報
export type User = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "student" | "admin"; // admin=管理者(あなた)
  createdAt: any; // Firestore Timestamp
};

// 2. ユーザーの学習成績
export type UserProfile = {
  uid: string;
  targetExam: string; // 例: "第114回"

  // リアルタイム分析用の集計データ
  stats: {
    totalAnswered: number; // 総回答数
    totalCorrect: number; // 正解数
    // 分野ごとの正答率 (レーダーチャート用)
    // 例: { "必修": 0.8, "循環器": 0.4 }
    tagAccuracy: { [key: string]: number };
  };
};

// 3. 問題データ (国試過去問)
export type Question = {
  id: string; // 自動ID (例: "113-am-001")
  examYear: string; // "第113回"
  questionNumber: string; // "午前1問"

  type: "mandatory" | "general" | "situation"; // 必修 / 一般 / 状況設定

  text: string; // 問題文
  imageUrl?: string; // 画像がある場合のURL
  choices: string[]; // 選択肢 ["ア...", "イ..."]
  correctIndices: number[]; // 正解の番号 (0始まり)

  explanation: string; // 解説文

  // 分析用タグ (ここが重要)
  tags: string[]; // ["呼吸器", "解剖生理", "Aランク"]
};

// 4. 学習履歴 (ログ)
export type StudyLog = {
  id: string;
  userId: string;
  questionId: string;
  question: Question; // 問題のスナップショット

  userChoice: number[]; // ユーザーが選んだ選択肢
  isCorrect: boolean; // 正解したか
  timeTaken: number; // 解答にかかった秒数

  createdAt: any; // 解いた日時

  // AI家庭教師との会話ログ
  aiChat?: {
    userQuestion: string;
    aiAnswer: string;
  }[];
};
