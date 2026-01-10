// ==========================================
// 既存の型定義 (そのまま)
// ==========================================
export interface Question {
  id: string;
  examYear: string;
  questionNumber: string;
  type: "mandatory" | "general" | "situation";
  text: string;
  choices: string[];
  correctIndices: number[];
  explanation?: string;
  imageUrl?: string;
  tags?: string[];
  lastResult?: {
    isCorrect: boolean;
    userChoice: number[];
    confidence?: "ok" | "so-so" | "ng";
    answeredAt?: Date;
    aiAdvice?: string;
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
  isPremium?: boolean;
  aiUsage?: {
    count: number;
    lastUsedAt: any;
  };
}

export interface StudyLog {
  id?: string;
  userId: string;
  questionId: string;
  question?: Question;
  userChoice: number[];
  isCorrect: boolean;
  confidence?: "ok" | "so-so" | "ng";
  createdAt: any;
  aiAdvice?: string;
  mode?: string;
  targetYear?: string | null;
}

// ==========================================
// ★★★ 今回追加する模試用の型定義 ★★★
// ==========================================

/**
 * 模試自体のデータ構造
 * (管理者が作成し、全ユーザーがこれを参照する)
 */
export interface MockExam {
  id: string;
  title: string; // 例: "第1回 全国統一模試"

  // 状態管理
  // draft: 作成中, active: 受験期間中, closed: 集計中, released: 結果公開済み
  status: "draft" | "active" | "closed" | "released";

  questions: Question[]; // 模試に含まれる問題リスト
  deadline: any; // 受験締切日 (Date or Timestamp)

  // 合格基準点（結果公開時に設定される想定だが、予め枠を作っておく）
  border?: {
    mandatory: number; // 必修の合格ライン (例: 40点)
    general: number; // 一般の合格ライン (例: 160点)
  };

  // 統計データ（集計後に更新される）
  stats?: {
    totalParticipants: number; // 受験者数
    mandatoryAverage: number; // 必修平均点
    generalAverage: number; // 一般平均点
    mandatoryBorder: number; // 確定した必修ボーダー
    generalBorder: number; // 確定した一般ボーダー
    mandatoryMax: number; // 必修満点
    generalMax: number; // 一般満点
  };

  createdAt: any;
}

/**
 * ユーザーの受験結果データ
 * (ユーザーごとに1つの模試につき1つ作成される)
 */
export interface MockExamSubmission {
  id?: string;
  examId: string; // どの模試か
  userId: string; // 誰の回答か

  // 回答データ: { "問題ID": 選択肢インデックス }
  // 未回答はキーが存在しないか -1
  answers: Record<string, number>;

  // 得点状況（計算後の値を保存）
  mandatoryScore: number; // 必修得点
  generalScore: number; // 一般得点（状況設定含む）
  totalScore: number; // 総合得点

  // 合否結果（statsのボーダーと照らし合わせた結果）
  isPassed?: boolean;

  submittedAt: any; // 提出日時
  updatedAt?: any; // 更新日時
}
