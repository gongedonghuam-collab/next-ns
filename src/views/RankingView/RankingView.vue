<template>
  <div class="min-h-screen bg-slate-50 font-sans pb-40">
    <div
      class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-b-[40px] shadow-xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-end pb-10"
      style="padding-top: max(3rem, env(safe-area-inset-top))"
    >
      <div
        class="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
      ></div>
      <div
        class="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"
      ></div>

      <div class="relative z-10 w-full px-6">
        <h2
          class="text-center font-black text-xl tracking-wider mb-6 text-white flex items-center justify-center gap-2 drop-shadow-md"
        >
          <span class="text-2xl filter drop-shadow-sm">🏆</span> LEADERBOARD
        </h2>

        <div
          class="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg text-white"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <p
                class="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1"
              >
                Current Title
              </p>
              <h2 class="text-2xl font-black drop-shadow-sm">
                {{ currentRank }}
              </h2>
            </div>
            <div
              class="bg-white/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm"
            >
              <span class="font-black text-sm">Lv.{{ currentLevel }}</span>
            </div>
          </div>

          <div class="flex items-end justify-between mb-2">
            <div>
              <span class="text-[10px] font-bold opacity-70">Total Score</span>
              <div class="text-3xl font-black leading-none mt-0.5">
                {{ formatNum(currentUser?.totalExp || totalExp)
                }}<span class="text-sm ml-1">pt</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[9px] font-bold opacity-70">Next Rank</span>
              <div class="font-bold text-sm">
                あと {{ 100 - levelProgress }} pt
              </div>
            </div>
          </div>

          <div
            class="w-full bg-black/20 h-2.5 rounded-full overflow-hidden border border-white/10"
          >
            <div
              class="bg-yellow-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(250,204,21,0.6)]"
              :style="{ width: `${levelProgress}%` }"
            ></div>
          </div>
        </div>

        <div class="mt-4 text-center">
          <span
            class="inline-block bg-white/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-1 text-xs font-bold text-white"
          >
            あなたの順位:
            <span class="text-lg font-black">{{ myRankText }}</span> 位
          </span>
        </div>
      </div>
    </div>

    <div class="px-5 mt-6 relative z-20 w-full space-y-3">
      <div
        v-if="loading"
        class="text-center py-20 text-slate-400 font-bold animate-pulse"
      >
        ランキングを集計中...
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(user, index) in rankingList"
          :key="user.uid"
          class="bg-white rounded-2xl p-4 flex items-center shadow-sm border border-slate-100 relative overflow-hidden transition-transform active:scale-[0.98]"
          :class="{
            'ring-2 ring-indigo-500 z-10 bg-indigo-50/50':
              user.uid === currentUser?.uid,
          }"
        >
          <div class="w-12 flex-shrink-0 flex justify-center text-center">
            <div
              v-if="index < 3"
              class="text-3xl drop-shadow-md transform scale-110"
            >
              {{ index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉" }}
            </div>
            <div
              v-else
              class="w-8 h-8 flex items-center justify-center font-black text-slate-500 bg-slate-100 rounded-full text-sm"
            >
              {{ index + 1 }}
            </div>
          </div>

          <div class="ml-3 flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="font-bold text-slate-800 truncate text-sm tracking-tight"
              >
                {{ user.displayName || "名無しナース" }}
              </span>
              <span
                v-if="user.uid === currentUser?.uid"
                class="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm tracking-wider"
                >YOU</span
              >
            </div>
            <span
              class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded"
            >
              Lv.{{ Math.floor((user.totalExp || 0) / 100) + 1 }}
            </span>
          </div>

          <div class="text-right pl-2">
            <div class="font-black text-slate-800 text-lg leading-none">
              {{ formatNum(user.totalExp || 0) }}
            </div>
            <div class="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
              pt
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useNextNs } from "@/composables/useNextNs";

const {
  currentUser,
  rankingList,
  fetchRanking,
  loading,
  totalExp,
  currentLevel,
  currentRank,
  levelProgress,
} = useNextNs();

onMounted(() => {
  fetchRanking();
});

const myRankText = computed(() => {
  if (!currentUser.value) return "-";
  const index = rankingList.value.findIndex(
    (u) => u.uid === currentUser.value?.uid
  );
  return index !== -1 ? `${index + 1}` : "-";
});

const formatNum = (num: number) => {
  return num.toLocaleString();
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
