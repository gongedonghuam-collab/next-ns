<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useNextNs } from "@/composables/useNextNs";
import QuizCard from "@/components/QuizCard/QuizCard.vue";

const router = useRouter();
const { reviewQuestions, loading, fetchReviewQuestions, saveAnswer } =
  useNextNs();

const isFinished = ref(false);
const currentIndex = ref(0);

const amPmFilter = ref<"all" | "am" | "pm">("all");
const confidenceFilter = ref<"all" | "ok" | "ng" | "so-so">("all");

onMounted(async () => {
  await fetchReviewQuestions();
});

// ★ 自信度（⭕️・🔺・❌）のみに基づいた絞り込みロジック (正誤は問わない)
const filteredList = computed(() => {
  return reviewQuestions.value.filter((q) => {
    // 1. 午前・午後チェック
    const matchTime =
      amPmFilter.value === "all" ||
      (amPmFilter.value === "am"
        ? q.questionNumber.includes("午前")
        : q.questionNumber.includes("午後"));

    // 2. 自信度チェックの修正 (自信度 ok = ⭕️ ならば表示)
    const matchConfidence =
      confidenceFilter.value === "all" ||
      (confidenceFilter.value === "ok"
        ? q.lastResult?.confidence === "ok" // ユーザーが⭕️を選んだもの
        : confidenceFilter.value === "ng"
        ? q.lastResult?.confidence === "ng" || q.lastResult?.isCorrect === false // ❌ または 不正解
        : q.lastResult?.confidence === "so-so"); // 🔺

    return matchTime && matchConfidence;
  });
});

const currentQuestion = computed(
  () => filteredList.value[currentIndex.value] || null
);
const hasAnsweredThisTime = ref(false);

watch(
  () => currentIndex.value,
  () => {
    hasAnsweredThisTime.value = false;
  }
);
watch(
  () => filteredList.value,
  () => {
    hasAnsweredThisTime.value = false;
  },
  { deep: true }
);

const handleAnswer = async (
  isCorrect: boolean,
  choiceIndex: number,
  confidence: any
) => {
  if (!currentQuestion.value) return;
  await saveAnswer(currentQuestion.value, choiceIndex, isCorrect, confidence);
  hasAnsweredThisTime.value = true;
};

const handleNext = () => {
  if (currentIndex.value < filteredList.value.length - 1) {
    currentIndex.value++;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    isFinished.value = true;
  }
};

const resetFilter = () => {
  currentIndex.value = 0;
  isFinished.value = false;
  hasAnsweredThisTime.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-24 font-sans">
    <header
      class="bg-white px-6 py-4 sticky top-0 z-30 shadow-sm border-b flex items-center justify-between"
    >
      <button
        @click="router.push('/')"
        class="text-slate-400 font-bold text-sm"
      >
        ← 戻る
      </button>
      <div class="text-center">
        <span
          class="text-[10px] font-black text-orange-600 block tracking-widest uppercase"
          >Review Mode</span
        >
        <span class="text-xs font-bold text-slate-400"
          >対象: {{ filteredList.length }}問 ({{ currentIndex + 1 }}問目)</span
        >
      </div>
      <div class="w-8"></div>
    </header>

    <main class="max-w-md mx-auto px-6 pt-6">
      <div class="space-y-3 mb-8">
        <div class="flex gap-2 bg-slate-200/50 p-1.5 rounded-2xl">
          <button
            v-for="m in [
              { id: 'all', n: '全て' },
              { id: 'am', n: '午前のみ' },
              { id: 'pm', n: '午後のみ' },
            ]"
            :key="m.id"
            @click="
              amPmFilter = m.id as any;
              resetFilter();
            "
            class="flex-1 py-2 text-[10px] font-bold rounded-xl transition-all"
            :class="
              amPmFilter === m.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500'
            "
          >
            {{ m.n }}
          </button>
        </div>
        <div class="flex gap-2 bg-orange-100/50 p-1.5 rounded-2xl">
          <button
            @click="
              confidenceFilter = 'all';
              resetFilter();
            "
            class="flex-1 py-2 text-[10px] font-bold rounded-xl transition-all"
            :class="
              confidenceFilter === 'all'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500'
            "
          >
            全て
          </button>
          <button
            @click="
              confidenceFilter = 'ok';
              resetFilter();
            "
            class="flex-1 py-2 text-[10px] font-bold rounded-xl transition-all"
            :class="
              confidenceFilter === 'ok'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500'
            "
          >
            ⭕️
          </button>
          <button
            @click="
              confidenceFilter = 'ng';
              resetFilter();
            "
            class="flex-1 py-2 text-[10px] font-bold rounded-xl transition-all"
            :class="
              confidenceFilter === 'ng'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-slate-500'
            "
          >
            ❌
          </button>
          <button
            @click="
              confidenceFilter = 'so-so';
              resetFilter();
            "
            class="flex-1 py-2 text-[10px] font-bold rounded-xl transition-all"
            :class="
              confidenceFilter === 'so-so'
                ? 'bg-white text-yellow-600 shadow-sm'
                : 'text-slate-500'
            "
          >
            🔺
          </button>
        </div>
      </div>

      <div
        v-if="loading"
        class="py-20 text-center text-slate-400 font-bold animate-pulse tracking-widest"
      >
        Loading...
      </div>

      <div v-else-if="currentQuestion && !isFinished">
        <QuizCard
          :question="currentQuestion"
          :index="currentIndex"
          @answer="handleAnswer"
        />
        <button
          v-if="hasAnsweredThisTime"
          @click="handleNext"
          class="w-full py-5 bg-orange-600 text-white font-black rounded-3xl shadow-xl shadow-orange-100 mt-4 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>次の問題へ</span>
          <span class="text-xl">→</span>
        </button>
      </div>

      <div
        v-else
        class="text-center py-20 bg-white rounded-[40px] shadow-sm border border-slate-100 p-10"
      >
        <div class="text-6xl mb-6">✨</div>
        <h2 class="text-xl font-black text-slate-800 mb-2">
          条件に合う問題は<br />ありません
        </h2>
        <button
          @click="router.push('/')"
          class="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition"
        >
          ホームへ戻る
        </button>
      </div>
    </main>
  </div>
</template>
