/**
 * NextNs (NurseCode) Type Definitions
 */

// 1. ユーザー情報
export type User = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "student" | "admin";
  createdAt: any;
};

// 2. ユーザーの学習成績
export type UserProfile = {
  uid: string;
  targetExam: string;
  stats: {
    totalAnswered: number;
    totalCorrect: number;
    tagAccuracy: { [key: string]: number };
  };
};

// 3. 問題データ
export type Question = {
  id: string;
  examYear: string;
  questionNumber: string;
  type: "mandatory" | "general" | "situation";
  text: string;
  imageUrl?: string;
  choices: string[];
  correctIndices: number[];
  explanation: string;
  tags: string[];

  // ★追加: 復習モード用（前回の結果を一時的に持たせる）
  lastResult?: {
    isCorrect: boolean;
    confidence?: "ok" | "so-so" | "ng";
    userChoice?: number[];
  };
};

// 4. 学習履歴 (ログ)
export type StudyLog = {
  id: string;
  userId: string;
  questionId: string;
  question: Question;

  userChoice: number[];
  isCorrect: boolean;
  timeTaken: number;

  createdAt: any;

  // 自信度
  confidence?: "ok" | "so-so" | "ng";

  aiChat?: {
    userQuestion: string;
    aiAnswer: string;
  }[];
};
