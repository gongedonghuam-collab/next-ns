<script setup lang="ts">
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import { collection, doc, writeBatch, getDocs } from "firebase/firestore";

const jsonInput = ref("");
const status = ref("待機中");
const isLoading = ref(false);
const totalQuestions = ref<number | null>(null);

// Firestoreから現在の問題数を取得
const fetchTotalCount = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "questions"));
    totalQuestions.value = querySnapshot.size;
  } catch (e) {
    console.error("カウント取得エラー:", e);
  }
};

onMounted(() => {
  fetchTotalCount();
});

const handleUpload = async () => {
  if (!jsonInput.value) return;

  let questions;
  try {
    questions = JSON.parse(jsonInput.value);
    if (!Array.isArray(questions)) {
      alert("エラー: データが配列形式（[...]）ではありません。");
      return;
    }
  } catch (e) {
    alert("エラー: JSONの形式が正しくありません。");
    return;
  }

  if (
    !confirm(
      `📦 ${questions.length}問のデータを検出しました。\nFirestoreに登録しますか？`
    )
  )
    return;

  isLoading.value = true;
  status.value = "登録準備中...";

  const total = questions.length;
  const CHUNK_SIZE = 400;
  const chunks = [];
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    chunks.push(questions.slice(i, i + CHUNK_SIZE));
  }

  try {
    let count = 0;
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      const colRef = collection(db, "questions");

      chunk.forEach((q: any) => {
        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          ...q,
          id: newDocRef.id,
          createdAt: new Date(),
        });
      });

      await batch.commit();
      count += chunk.length;
      status.value = `登録中... ${count} / ${total} 完了`;
    }

    status.value = "✅ 登録完了！";
    alert("すべてのデータが登録されました！");
    jsonInput.value = "";
    fetchTotalCount(); // カウント更新
  } catch (e) {
    console.error(e);
    status.value = "❌ エラー発生";
    alert("登録中にエラーが発生しました。");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="p-5 border-2 border-dashed border-stone-300 my-5 rounded-lg bg-stone-50"
  >
    <div class="flex justify-between items-center mb-4">
      <h3 class="m-0 font-bold text-stone-700">
        ⚡️ コピペ一発登録くん (Vue版)
      </h3>
      <div
        class="bg-white px-4 py-1 rounded-full border border-stone-200 font-bold text-blue-600 text-sm"
      >
        📊 現在の問題数:
        {{ totalQuestions === null ? "..." : `${totalQuestions}問` }}
      </div>
    </div>

    <p class="text-xs text-stone-500 mb-2">
      ここにChatGPTが作ったJSONコード（ [ ... ] の中身すべて
      ）を貼り付けてください。
    </p>

    <textarea
      v-model="jsonInput"
      placeholder='ここにJSONデータを貼り付け&#13;&#10;例: [{"text": "...", ...}]'
      class="w-full h-40 p-3 font-mono text-xs border border-stone-300 rounded mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
    ></textarea>

    <div class="flex items-center gap-3">
      <button
        @click="handleUpload"
        :disabled="isLoading || !jsonInput"
        class="px-5 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
      >
        {{ isLoading ? "処理中..." : "🔥 データを登録する" }}
      </button>
      <span
        class="font-bold text-sm"
        :class="status.includes('エラー') ? 'text-red-500' : 'text-stone-700'"
      >
        {{ status }}
      </span>
    </div>
  </div>
</template>
