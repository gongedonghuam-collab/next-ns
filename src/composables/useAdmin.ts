import { ref } from "vue";
import { db } from "@/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import type { Question } from "@/types";

export function useAdmin() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // --- 問題の追加 ---
  const addQuestion = async (q: Omit<Question, "id">) => {
    loading.value = true;
    error.value = null;
    try {
      // 余分な空欄などを除去して整形
      const cleanData = {
        ...q,
        choices: q.choices.filter((c) => c.trim() !== ""), // 空の選択肢は除外
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "questions"), cleanData);
      alert("✅ 問題を追加しました！");
    } catch (e: any) {
      console.error(e);
      error.value = "追加に失敗しました: " + e.message;
      alert(error.value);
    } finally {
      loading.value = false;
    }
  };

  // --- 問題の更新 ---
  const updateQuestion = async (id: string, q: Partial<Question>) => {
    if (!confirm("この問題を修正して保存しますか？")) return;
    loading.value = true;
    error.value = null;
    try {
      const cleanData = {
        ...q,
        // 選択肢がある場合は空文字除去
        ...(q.choices
          ? { choices: q.choices.filter((c) => c.trim() !== "") }
          : {}),
        updatedAt: serverTimestamp(),
      };
      // idはドキュメントに含まないので削除
      delete (cleanData as any).id;

      await updateDoc(doc(db, "questions", id), cleanData);
      alert("✅ 修正を保存しました！");
    } catch (e: any) {
      console.error(e);
      error.value = "更新に失敗しました: " + e.message;
      alert(error.value);
    } finally {
      loading.value = false;
    }
  };

  // --- 問題の削除 ---
  const removeQuestion = async (id: string) => {
    if (!confirm("⚠️ 本当に削除しますか？この操作は取り消せません。")) return;
    loading.value = true;
    try {
      await deleteDoc(doc(db, "questions", id));
      alert("🗑️ 削除しました");
    } catch (e: any) {
      console.error(e);
      error.value = "削除に失敗しました: " + e.message;
      alert(error.value);
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    addQuestion,
    updateQuestion,
    removeQuestion,
  };
}
