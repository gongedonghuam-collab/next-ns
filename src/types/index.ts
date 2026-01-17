// src/types/index.ts

export interface Question {
  id: string;
  examYear: string;
  questionNumber: string;
  // ★ case_study を追加
  type: "mandatory" | "general" | "situation" | "case_study";
  text: string;
  choices: string[];
  correctIndices: number[];
  explanation?: string;
  imageUrl?: string;
  tags?: string[];

  // ★ 親子関係用フィールドを追加
  parentId?: string;
  parentData?: Question;

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

export interface MockExam {
  id: string;
  title: string;
  status: "draft" | "active" | "closed" | "released";
  questions: Question[];
  deadline: any;
  border?: {
    mandatory: number;
    general: number;
  };
  stats?: {
    totalParticipants: number;
    mandatoryAverage: number;
    generalAverage: number;
    mandatoryBorder: number;
    generalBorder: number;
    mandatoryMax: number;
    generalMax: number;
  };
  createdAt: any;
}

export interface MockExamSubmission {
  id?: string;
  examId: string;
  userId: string;
  answers: Record<string, number>;
  mandatoryScore: number;
  generalScore: number;
  totalScore: number;
  isPassed?: boolean;
  submittedAt: any;
  updatedAt?: any;
}
