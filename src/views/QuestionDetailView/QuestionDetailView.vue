<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
    <header
      class="bg-white px-6 py-4 shadow-sm border-b border-slate-100 flex items-center gap-4 sticky top-0 z-30"
    >
      <button
        @click="$router.back()"
        class="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition"
      >
        ←
      </button>
      <div>
        <h1 class="font-bold text-slate-800 text-sm">問題詳細</h1>
        <p class="text-[10px] text-slate-400 font-bold" v-if="targetQuestion">
          {{ targetQuestion.examYear }} {{ targetQuestion.questionNumber }}
        </p>
      </div>
    </header>

    <main class="flex-1 p-6 pb-32 max-w-md mx-auto w-full">
      <div
        v-if="loading"
        class="text-center py-20 text-slate-400 font-bold animate-pulse"
      >
        読み込み中...
      </div>

      <div v-else-if="targetQuestion">
        <QuizCard
          :question="targetQuestion"
          :index="0"
          @answer="handleAnswer"
        />
      </div>

      <div v-else class="text-center py-20">
        <p class="text-slate-400 font-bold mb-4">
          問題が見つかりませんでした🙇‍♂️
        </p>
        <button
          @click="$router.push('/')"
          class="text-blue-500 text-sm font-bold"
        >
          ホームに戻る
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useNextNs } from "@/composables/useNextNs";
import QuizCard from "@/components/QuizCard/QuizCard.vue";
import type { Question } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

const route = useRoute();
const { masterQuestions, fetchAllQuestions, saveAnswer } = useNextNs();

const targetQuestion = ref<Question | null>(null);
const loading = ref(true);

onMounted(async () => {
  const questionId = route.params.id as string;

  // 1. まず手元のマスターデータから探す (高速)
  if (masterQuestions.value.length === 0) {
    await fetchAllQuestions();
  }
  const found = masterQuestions.value.find((q) => q.id === questionId);

  if (found) {
    targetQuestion.value = found;
    loading.value = false;
  } else {
    // 2. なければFirestoreから直接取得 (念のため)
    try {
      const docRef = doc(db, "questions", questionId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        targetQuestion.value = { id: snap.id, ...snap.data() } as Question;
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
});

// 回答時の処理（履歴に残すかどうかはお好みで。今回は残す設定にします）
const handleAnswer = async (
  isCorrect: boolean,
  choiceIndex: number,
  confidence: any
) => {
  if (targetQuestion.value) {
    await saveAnswer(targetQuestion.value, choiceIndex, isCorrect, confidence);
  }
};
</script>
