<template>
  <div
    class="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden"
  >
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div
        class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[100px] opacity-30"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[100px] opacity-30"
      ></div>
    </div>

    <div
      class="relative z-10 max-w-md w-full text-center space-y-8 animate-fade-in"
    >
      <div class="space-y-2">
        <span
          class="text-xs font-bold text-yellow-400 border border-yellow-400/30 px-3 py-1 rounded-full uppercase tracking-widest bg-yellow-400/10"
          >Premium Plan</span
        >
        <h1 class="text-4xl font-black leading-tight">
          学習効率を<br />最大化しよう
        </h1>
        <p class="text-slate-400 text-sm font-bold">
          専属AIチューターがあなたの合格をサポートします
        </p>
      </div>

      <div class="grid gap-4">
        <div
          class="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between"
        >
          <div class="text-left">
            <div class="font-bold text-slate-400 text-sm">Free</div>
            <div class="text-xs text-slate-500">基本機能のみ</div>
          </div>
          <div class="text-right">
            <div class="font-bold">AI解説 1日3回</div>
            <div class="text-xs text-slate-500">広告あり</div>
          </div>
        </div>

        <div
          class="bg-gradient-to-r from-indigo-600 to-purple-600 p-[1px] rounded-2xl transform scale-105 shadow-xl shadow-indigo-900/50"
        >
          <div
            class="bg-slate-900 rounded-2xl p-6 flex items-center justify-between h-full"
          >
            <div class="text-left">
              <div class="font-bold text-white text-lg flex items-center gap-2">
                Premium
                <span
                  class="text-[10px] bg-white text-indigo-600 px-2 py-0.5 rounded-full font-black"
                  >PRO</span
                >
              </div>
              <div class="text-xs text-indigo-200 mt-1">合格への最短ルート</div>
            </div>
            <div class="text-right">
              <div class="font-black text-2xl text-yellow-400">無制限</div>
              <div class="text-xs text-slate-400">全ての機能を開放</div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4 pt-4">
        <button
          @click="handleUpgrade"
          :disabled="loading"
          class="w-full py-4 bg-white text-slate-900 font-black rounded-2xl shadow-xl hover:bg-slate-100 transition active:scale-95 flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="animate-spin">🌀</span>
          <span>プレミアムにアップグレード</span>
        </button>
        <button
          @click="$router.back()"
          class="text-xs font-bold text-slate-500 hover:text-slate-300 transition"
        >
          今はしない
        </button>
      </div>

      <p
        class="text-[10px] text-slate-600 leading-relaxed border-t border-slate-800 pt-4 mt-4"
      >
        ※デモ画面です。実際の課金は発生しません。<br />
        ボタンを押すと即座にプレミアム権限が付与されます。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNextNs } from "@/composables/useNextNs";
import { useRouter } from "vue-router";

const router = useRouter();
const { upgradeToPremium, loading } = useNextNs();

const handleUpgrade = async () => {
  await upgradeToPremium();
  router.back(); // 完了したら元の画面に戻る
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
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
