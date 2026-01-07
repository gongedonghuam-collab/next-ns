<template>
  <div class="pb-32 animate-fade-in">
    <div
      class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-b-[40px] shadow-lg mb-6 text-white"
    >
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-black tracking-tight flex items-center gap-2">
          🏆 Ranking
        </h2>
        <div class="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
          TOP 50
        </div>
      </div>

      <div
        class="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20"
      >
        <div>
          <p
            class="text-[10px] font-bold text-indigo-100 uppercase tracking-widest"
          >
            Your Rank
          </p>
          <div class="text-3xl font-black text-white mt-1">
            {{ myRankText }}
          </div>
        </div>
        <div class="text-right">
          <p
            class="text-[10px] font-bold text-indigo-100 uppercase tracking-widest"
          >
            Total Exp
          </p>
          <div class="text-xl font-black text-white mt-1">
            {{ currentUser?.totalExp || totalExp }}
            <span class="text-xs font-normal opacity-80">pt</span>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4">
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
          class="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden transition hover:scale-[1.01]"
          :class="{
            'ring-2 ring-indigo-400 bg-indigo-50/30':
              user.uid === currentUser?.uid,
          }"
        >
          <div
            class="w-10 h-10 flex items-center justify-center font-black rounded-full text-lg shadow-inner shrink-0"
            :class="getRankColor(index + 1)"
          >
            {{ index + 1 }}
          </div>

          <div class="flex-1 min-w-0 z-10">
            <div class="font-bold text-slate-800 truncate">
              {{ user.displayName || "名無しナース" }}
              <span
                v-if="user.uid === currentUser?.uid"
                class="ml-1 text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full"
                >YOU</span
              >
            </div>
            <div class="text-xs text-slate-400 font-bold mt-0.5">
              Lv.{{ Math.floor((user.totalExp || 0) / 100) + 1 }}
            </div>
          </div>

          <div class="text-right z-10">
            <div class="font-black text-slate-800 text-lg tracking-tight">
              {{ formatNum(user.totalExp || 0) }}
            </div>
            <div class="text-[9px] font-bold text-slate-400 uppercase">Exp</div>
          </div>

          <div
            v-if="index < 3"
            class="absolute -right-4 -bottom-4 text-6xl opacity-10 select-none"
          >
            {{ index === 0 ? "👑" : index === 1 ? "🥈" : "🥉" }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useNextNs } from "@/composables/useNextNs";

const { currentUser, rankingList, fetchRanking, loading, totalExp } =
  useNextNs();

onMounted(() => {
  fetchRanking();
});

const myRankText = computed(() => {
  if (!currentUser.value) return "-";
  const index = rankingList.value.findIndex(
    (u) => u.uid === currentUser.value?.uid
  );
  return index !== -1 ? `${index + 1}位` : "圏外";
});

const getRankColor = (rank: number) => {
  if (rank === 1)
    return "bg-yellow-100 text-yellow-600 border border-yellow-200";
  if (rank === 2) return "bg-slate-200 text-slate-600 border border-slate-300";
  if (rank === 3)
    return "bg-orange-100 text-orange-600 border border-orange-200";
  return "bg-slate-50 text-slate-400 border border-slate-100 text-sm";
};

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
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
