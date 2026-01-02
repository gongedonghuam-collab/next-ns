<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useNextNs } from "@/composables/useNextNs";
import QuizCard from "@/components/QuizCard/QuizCard.vue";

const router = useRouter();
const {
  questions,
  loading,
  fetchQuestions,
  selectedPeriod,
  currentSessionIndex,
  saveAnswer,
  clearSession,
  goToNext,
  finishSession, // ★ 追加
} = useNextNs();

onMounted(async () => {
  await fetchQuestions({});
});

const currentQuestion = computed(
  () => questions.value[currentSessionIndex.value] || null
);

const handleAnswer = async (
  isCorrect: boolean,
  choiceIndex: number,
  confidence: any
) => {
  if (!currentQuestion.value) return;
  await saveAnswer(currentQuestion.value, choiceIndex, isCorrect, confidence);
};

// ★ 修正: 最後の問題なら集計してリザルトへ
const handleNext = () => {
  if (currentSessionIndex.value < questions.value.length - 1) {
    goToNext();
  } else {
    finishSession(); // 集計実行
    router.push("/result"); // 画面遷移
  }
};

const resetAndFetch = async (mode: "all" | "am" | "pm") => {
  if (confirm("現在の進捗をリセットして、新しく問題を読み込みますか？")) {
    clearSession();
    selectedPeriod.value = mode;
    await fetchQuestions({ force: true });
  }
};

const isAnsweredLocally = (q: any) => {
  return !!q?.lastResult;
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-24 font-sans">
    <header
      class="bg-white px-6 py-4 sticky top-0 z-30 shadow-sm border-b border-slate-100 flex items-center justify-between"
    >
      <button
        @click="router.push('/')"
        class="text-slate-400 font-bold text-sm"
      >
        ← 終了
      </button>
      <div class="text-center">
        <span
          class="text-[10px] font-black text-blue-600 block tracking-widest uppercase"
          >Training Mode</span
        >
        <span class="text-xs font-bold text-slate-400">
          今回: {{ currentSessionIndex + 1 }} / {{ questions.length }}問目
        </span>
      </div>
      <button
        @click="resetAndFetch(selectedPeriod)"
        class="text-blue-500 text-[10px] font-black border border-blue-100 px-2 py-1 rounded-lg bg-blue-50 transition active:scale-95"
      >
        リセット
      </button>
    </header>

    <main class="max-w-md mx-auto px-6 pt-6">
      <div class="flex gap-2 mb-6 bg-slate-200/50 p-1 rounded-2xl">
        <button
          v-for="m in [
            { id: 'all', n: '全件' },
            { id: 'am', n: '午前のみ' },
            { id: 'pm', n: '午後のみ' },
          ]"
          :key="m.id"
          @click="resetAndFetch(m.id as any)"
          class="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
          :class="
            selectedPeriod === m.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500'
          "
        >
          {{ m.n }}
        </button>
      </div>

      <div
        v-if="loading"
        class="py-20 text-center text-slate-400 font-bold animate-pulse"
      >
        問題を準備しています...
      </div>

      <div v-else-if="currentQuestion">
        <QuizCard
          :question="currentQuestion"
          :index="currentSessionIndex"
          @answer="handleAnswer"
        />

        <button
          v-if="isAnsweredLocally(currentQuestion)"
          @click="handleNext"
          class="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-200 mt-4 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>{{
            currentSessionIndex < questions.length - 1
              ? "次の問題へ進む"
              : "結果を見る"
          }}</span>
          <span class="text-xl">→</span>
        </button>
      </div>
    </main>
  </div>
</template>
