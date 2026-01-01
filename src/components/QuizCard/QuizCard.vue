<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { Question } from "@/types";
import { useNextNs } from "@/composables/useNextNs";

const {
  askAI,
  aiResponse,
  isAiThinking,
  toggleBookmark,
  bookmarkedIds,
  clearedQuestionIds,
} = useNextNs();

const props = defineProps<{
  question: Question;
  index: number;
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

// 克服済みかどうか
const isCleared = computed(() =>
  clearedQuestionIds.value.has(props.question.id)
);

// 前回の自信度（復習モード用）
const lastConfidence = computed(() => props.question.lastResult?.confidence);
const lastCorrect = computed(() => props.question.lastResult?.isCorrect);

watch(
  () => props.question.id,
  () => {
    selectedIndex.value = null;
    isAnswered.value = false;
    showAiComment.value = false;
  }
);

const handleChoice = (idx: number) => {
  if (isAnswered.value) return;
  selectedIndex.value = idx;
};

// 自信度ボタンが押されたら確定
const submitWithConfidence = (confidence: "ok" | "so-so" | "ng") => {
  if (selectedIndex.value === null) return;

  isAnswered.value = true;
  const isCorrect = props.question.correctIndices.includes(selectedIndex.value);
  emit("answer", isCorrect, selectedIndex.value, confidence);
};

const handleAskAi = async () => {
  showAiComment.value = true;
  if (!aiResponse.value || !isAiThinking.value) {
    await askAI(props.question);
  }
};
</script>

<template>
  <div
    class="bg-white rounded-3xl p-6 shadow-sm border mb-6 transition-all duration-300 relative overflow-hidden"
    :class="
      isCleared ? 'border-orange-300 bg-orange-50/50' : 'border-slate-100'
    "
  >
    <div
      v-if="isCleared"
      class="absolute top-0 left-0 bg-orange-400 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl z-20"
    >
      🎉 克服！
    </div>

    <div
      v-if="lastConfidence"
      class="absolute top-0 left-0 z-10 flex gap-1 p-2"
    >
      <span
        v-if="lastCorrect === false"
        class="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded"
        >前回: 不正解</span
      >
      <span
        v-if="lastConfidence === 'so-so'"
        class="bg-yellow-100 text-yellow-600 text-[10px] font-bold px-2 py-0.5 rounded"
        >前回: 🔺</span
      >
      <span
        v-if="lastConfidence === 'ng'"
        class="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded"
        >前回: ❌</span
      >
    </div>

    <button
      @click.stop="toggleBookmark(question)"
      class="absolute top-0 right-0 p-4 z-10 transition-transform active:scale-90 hover:scale-110"
      :title="bookmarkedIds.has(question.id) ? '保存を解除' : '問題を保存'"
    >
      <span class="text-2xl filter drop-shadow-sm">
        {{ bookmarkedIds.has(question.id) ? "🔖" : "📑" }}
      </span>
    </button>

    <div class="flex justify-between items-center mb-4 pr-8 pt-6">
      <span
        class="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full"
      >
        {{ question.examYear }} {{ question.questionNumber }}
      </span>
      <div class="flex gap-1">
        <span
          v-for="tag in question.tags"
          :key="tag"
          class="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full"
        >
          #{{ tag }}
        </span>
      </div>
    </div>

    <h3 class="font-bold text-slate-800 text-lg mb-6 leading-relaxed">
      <span class="text-blue-600 mr-2">Q{{ index + 1 }}.</span>
      {{ question.text }}
    </h3>

    <div class="space-y-3">
      <button
        v-for="(choice, idx) in question.choices"
        :key="idx"
        @click="handleChoice(idx)"
        class="w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-bold text-sm relative"
        :class="{
          'border-slate-100 hover:bg-slate-50 text-slate-600':
            !isAnswered && selectedIndex !== idx,
          'border-blue-500 bg-blue-50 text-blue-700':
            selectedIndex === idx && !isAnswered,
          'border-slate-300 bg-slate-100 text-slate-400':
            isAnswered && selectedIndex !== idx,
          'border-blue-400 bg-blue-50 text-blue-700':
            isAnswered && question.correctIndices.includes(idx),
          'border-red-400 bg-red-50 text-red-500 opacity-60':
            isAnswered &&
            selectedIndex === idx &&
            !question.correctIndices.includes(idx),
        }"
        :disabled="isAnswered"
      >
        <span
          class="absolute left-4 top-1/2 -translate-y-1/2 font-mono opacity-30"
          >{{ idx + 1 }}</span
        >
        <span class="pl-6">{{ choice }}</span>

        <span
          v-if="isAnswered && question.correctIndices.includes(idx)"
          class="absolute right-4 text-lg"
          >🙆‍♂️</span
        >
        <span
          v-if="
            isAnswered &&
            selectedIndex === idx &&
            !question.correctIndices.includes(idx)
          "
          class="absolute right-4 text-lg"
          >🙅‍♀️</span
        >
      </button>
    </div>

    <div
      v-if="selectedIndex !== null && !isAnswered"
      class="mt-6 pt-4 border-t border-dashed border-slate-200 animate-fade-in"
    >
      <p class="text-center text-xs font-bold text-slate-500 mb-3">
        この回答の自信は？
      </p>
      <div class="flex gap-2 justify-center">
        <button
          @click="submitWithConfidence('ok')"
          class="flex-1 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100 hover:bg-blue-100 transition shadow-sm"
        >
          ⭕️ 自信あり
        </button>
        <button
          @click="submitWithConfidence('so-so')"
          class="flex-1 py-3 rounded-xl bg-yellow-50 text-yellow-600 font-bold border border-yellow-100 hover:bg-yellow-100 transition shadow-sm"
        >
          🔺 あやふや
        </button>
        <button
          @click="submitWithConfidence('ng')"
          class="flex-1 py-3 rounded-xl bg-red-50 text-red-600 font-bold border border-red-100 hover:bg-red-100 transition shadow-sm"
        >
          ❌ 自信なし
        </button>
      </div>
    </div>

    <div
      v-if="isAnswered"
      class="mt-6 pt-6 border-t border-dashed border-slate-200 animate-fade-in"
    >
      <p class="text-xs font-bold text-slate-400 mb-2">解説</p>
      <div
        class="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl mb-4"
      >
        {{ question.explanation }}
      </div>

      <button
        v-if="!showAiComment"
        @click="handleAskAi"
        class="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95"
      >
        <span>🤖</span> AI先生に詳しく聞く
      </button>

      <div
        v-else
        class="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-fade-in"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">🤖</span>
          <span class="text-xs font-bold text-indigo-800">AI先生の解説</span>
        </div>

        <div v-if="isAiThinking" class="flex flex-col items-center py-4">
          <div
            class="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"
          ></div>
          <p class="text-[10px] text-indigo-400">解説を生成中...</p>
        </div>

        <div
          v-else
          class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
        >
          {{ aiResponse }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
