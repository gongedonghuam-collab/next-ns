<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import type { Question } from "@/types";
import { useNextNs } from "@/composables/useNextNs";
import { useRouter } from "vue-router";

const router = useRouter();
const { askAI, aiResponse, isAiThinking, toggleBookmark, bookmarkedIds } =
  useNextNs();

const props = defineProps<{
  question: Question;
  index: number;
  isReviewMode?: boolean;
}>();

const emit = defineEmits<{
  (
    e: "answer",
    isCorrect: boolean,
    choiceIndex: number,
    confidence: "ok" | "so-so" | "ng"
  ): void;
}>();

const selectedIndex = ref<number | null>(null);
const isAnswered = ref(false);
const showAiComment = ref(false);
const showPopup = ref<"correct" | "incorrect" | null>(null);

onMounted(() => {
  if (props.isReviewMode) {
    isAnswered.value = true;
  }
});

watch(
  () => props.question.id,
  () => {
    if (props.isReviewMode) {
      isAnswered.value = true;
      selectedIndex.value = null;
    } else {
      selectedIndex.value = null;
      isAnswered.value = false;
    }
    showAiComment.value = false;
    showPopup.value = null;
  },
  { immediate: true }
);

const handleChoice = (idx: number) => {
  if (isAnswered.value) return;
  selectedIndex.value = idx;
};

const submitWithConfidence = (confidence: "ok" | "so-so" | "ng") => {
  if (selectedIndex.value === null) return;
  const isCorrect = props.question.correctIndices.includes(selectedIndex.value);
  showPopup.value = isCorrect ? "correct" : "incorrect";
  isAnswered.value = true;
  emit("answer", isCorrect, selectedIndex.value, confidence);
  setTimeout(() => {
    showPopup.value = null;
  }, 1200);
};

const handleAskAi = async () => {
  showAiComment.value = true;
  await askAI(props.question);
};

const hasSavedAiAdvice = computed(() => {
  return !!props.question.lastResult?.aiAdvice;
});

const correctAnswerLabel = computed(() => {
  return props.question.correctIndices.map((i) => i + 1).join("・");
});
</script>

<template>
  <div
    class="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 mb-6 relative overflow-hidden transition-all"
  >
    <Transition name="judge-pop">
      <div
        v-if="showPopup"
        class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-white/40 backdrop-blur-[2px]"
      >
        <div
          v-if="showPopup === 'correct'"
          class="text-[120px] leading-none text-red-500 font-bold drop-shadow-xl"
        >
          ⭕️
        </div>
        <div
          v-if="showPopup === 'incorrect'"
          class="text-[120px] leading-none text-blue-500 font-bold drop-shadow-xl"
        >
          ❌
        </div>
      </div>
    </Transition>

    <button
      @click="toggleBookmark(question)"
      class="absolute top-6 right-6 text-2xl transition active:scale-90 z-10"
    >
      {{ bookmarkedIds.has(question.id) ? "🔖" : "📑" }}
    </button>

    <div class="mb-6 pr-8">
      <div class="mb-3">
        <span
          class="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest inline-block"
        >
          {{ question.examYear }}
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in question.tags"
          :key="tag"
          class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 whitespace-nowrap"
        >
          #{{ tag }}
        </span>
      </div>
    </div>

    <h3 class="font-bold text-slate-800 text-lg mb-8 leading-relaxed">
      <span class="text-blue-600 mr-2">Q{{ index + 1 }}.</span
      >{{ question.text }}
    </h3>

    <div class="space-y-3">
      <button
        v-for="(choice, idx) in question.choices"
        :key="idx"
        @click="handleChoice(idx)"
        class="w-full text-left p-5 rounded-2xl border-2 transition-all font-bold text-sm relative"
        :class="{
          'border-slate-100 hover:bg-slate-50':
            !isAnswered && selectedIndex !== idx,
          'border-blue-500 bg-blue-50 text-blue-700':
            selectedIndex === idx && !isAnswered,
          'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100':
            isAnswered && question.correctIndices.includes(idx),
          'border-slate-300 bg-slate-100 text-slate-400':
            isAnswered &&
            !question.correctIndices.includes(idx) &&
            selectedIndex !== idx,
          'border-blue-400 bg-blue-50 text-blue-600 opacity-80':
            isAnswered &&
            selectedIndex === idx &&
            !question.correctIndices.includes(idx),
        }"
        :disabled="isAnswered"
      >
        <span class="pl-2">{{ choice }}</span>
      </button>
    </div>

    <div
      v-if="selectedIndex !== null && !isAnswered"
      class="mt-8 pt-6 border-t border-dashed border-slate-200 animate-enter text-center"
    >
      <p
        class="text-xs font-bold text-slate-400 mb-4 tracking-widest uppercase"
      >
        Confidence check
      </p>

      <div class="flex flex-col sm:flex-row gap-3">
        <button
          @click="submitWithConfidence('ok')"
          class="w-full sm:flex-1 py-3 sm:py-4 rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-100 active:scale-95 transition"
        >
          ⭕️ 自信あり
        </button>
        <button
          @click="submitWithConfidence('so-so')"
          class="w-full sm:flex-1 py-3 sm:py-4 rounded-2xl bg-yellow-400 text-white font-black shadow-lg shadow-yellow-100 active:scale-95 transition"
        >
          🔺 まぁまぁ
        </button>
        <button
          @click="submitWithConfidence('ng')"
          class="w-full sm:flex-1 py-3 sm:py-4 rounded-2xl bg-red-500 text-white font-black shadow-lg shadow-red-100 active:scale-95 transition"
        >
          ❌ 自信なし
        </button>
      </div>
    </div>

    <div
      v-if="isAnswered"
      class="mt-8 pt-8 border-t border-dashed border-slate-200 animate-enter"
    >
      <div
        class="mb-6 flex flex-col items-center justify-center p-4 bg-red-50 rounded-2xl border border-red-100"
      >
        <span
          class="text-xs font-bold text-red-400 uppercase tracking-widest mb-1"
          >Answer</span
        >
        <div class="text-2xl font-black text-red-600">
          正解は {{ correctAnswerLabel }} です
        </div>
      </div>

      <p
        class="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest"
      >
        Explanation
      </p>
      <div
        class="text-sm text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-[32px] mb-6 shadow-inner"
      >
        {{ question.explanation }}
      </div>

      <button
        v-if="!showAiComment"
        @click="handleAskAi"
        class="w-full py-4 bg-indigo-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition overflow-hidden relative group"
      >
        <div
          class="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition duration-500"
        ></div>
        <span class="relative z-10 text-xl">🤖</span>
        <span class="relative z-10">
          {{
            hasSavedAiAdvice
              ? "📝 保存された解説を見る"
              : "✨ AI先生に詳しく聞く"
          }}
        </span>
      </button>

      <div
        v-else
        class="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 relative animate-fade-in"
      >
        <div
          v-if="isAiThinking"
          class="flex flex-col items-center justify-center py-8"
        >
          <div class="spinner mb-3"></div>
          <p class="text-xs font-bold text-indigo-400 animate-pulse">
            AI先生が思考中...
          </p>
        </div>

        <div
          v-else
          class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
        >
          <div
            class="flex items-center gap-2 mb-2 text-indigo-800 font-bold border-b border-indigo-100 pb-2"
          >
            <span>🎓</span> AIチューターの解説
            <span
              v-if="hasSavedAiAdvice"
              class="text-[9px] bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded ml-auto"
              >History</span
            >
          </div>
          {{ aiResponse }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.judge-pop-enter-active {
  animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.judge-pop-leave-active {
  animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) reverse;
}

@keyframes pop-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-enter {
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.spinner {
  width: 32px;
  height: 32px;
  border: 4px solid rgba(99, 102, 241, 0.2);
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
