<template>
  <div
    class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans"
  >
    <div
      v-if="sessionResult"
      class="w-full max-w-md bg-white rounded-[40px] shadow-xl p-8 text-center animate-fade-in space-y-6"
    >
      <div>
        <p
          class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2"
        >
          Session Result
        </p>
        <h1 class="text-2xl font-black text-slate-800">おつかれさまでした！</h1>
      </div>

      <div class="relative py-4">
        <div
          class="w-48 h-48 mx-auto rounded-full border-[12px] flex items-center justify-center relative"
          :class="getBorderColor(sessionResult.judge)"
        >
          <div class="text-center">
            <div class="text-sm font-bold text-slate-400 mb-1">正答率</div>
            <div class="text-5xl font-black text-slate-800 tracking-tighter">
              {{ sessionResult.rate }}<span class="text-2xl">%</span>
            </div>
            <div class="text-sm font-bold text-slate-500 mt-2">
              {{ sessionResult.correct }} / {{ sessionResult.total }} 問
            </div>
          </div>
        </div>

        <div
          class="absolute bottom-2 right-8 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12"
        >
          判定: {{ sessionResult.judge }}
        </div>
      </div>

      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <p class="text-sm font-bold text-slate-600 leading-relaxed">
          {{ sessionResult.judgeText }}
        </p>
      </div>

      <div class="space-y-3 pt-4">
        <button
          @click="router.push('/')"
          class="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95"
        >
          ホームに戻る
        </button>

        <button
          v-if="sessionResult.correct < sessionResult.total"
          @click="router.push('/review')"
          class="w-full py-4 bg-white text-orange-600 border-2 border-orange-100 font-black rounded-2xl hover:bg-orange-50 transition active:scale-95"
        >
          間違えた問題を復習する
        </button>
      </div>
    </div>

    <div v-else class="text-center">
      <p class="text-slate-400 font-bold mb-4">データがありません</p>
      <button
        @click="router.push('/')"
        class="text-blue-500 font-bold underline"
      >
        ホームへ
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useNextNs } from "@/composables/useNextNs";

const router = useRouter();
const { sessionResult } = useNextNs();

// 判定に応じた色を返す
const getBorderColor = (judge: string) => {
  if (judge === "S" || judge === "A") return "border-blue-500 bg-blue-50/30";
  if (judge === "B") return "border-orange-400 bg-orange-50/30";
  return "border-slate-200 bg-slate-50";
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
