export interface Question {
  id: string;
  examYear: string; // "第113回"
  questionNumber: string; // "午前1"
  type: "mandatory" | "general" | "situation"; // 必修 | 一般 | 状況設定
  text: string;
  choices: string[];
  correctIndices: number[]; // [0] for A (indices)
  explanation?: string;
  imageUrl?: string; // 画像問題用URL
  tags?: string[];
  lastResult?: {
    isCorrect: boolean;
    userChoice: number[];
    confidence?: "ok" | "so-so" | "ng"; // ⭕️ 🔺 ❌
    answeredAt?: Date;
    aiAdvice?: string; // AIのアドバイス一時保存用
  };
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "admin" | "student";
  createdAt: any;
  totalExp?: number;
  lastActiveAt?: any;
  // ★ ここが追加された重要な部分です
  isPremium?: boolean;
  aiUsage?: {
    count: number; // 今日の使用回数
    lastUsedAt: any; // 最後に使った日
  };
}

export interface StudyLog {
  id?: string;
  userId: string;
  questionId: string;
  question?: Question; // 履歴表示用に丸ごと持つことも
  userChoice: number[];
  isCorrect: boolean;
  confidence?: "ok" | "so-so" | "ng";
  createdAt: any;
  aiAdvice?: string; // AIのアドバイス履歴用
}
