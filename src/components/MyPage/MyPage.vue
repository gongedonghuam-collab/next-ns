<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useNextNs } from "@/composables/useNextNs";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "vue-chartjs";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const {
  fetchHistory,
  studyLogs,
  loading,
  currentLevel,
  levelProgress,
  currentRank,
  totalExp,
} = useNextNs();

onMounted(() => {
  fetchHistory();
});

const chartData = computed(() => {
  if (studyLogs.value.length === 0) {
    return {
      labels: ["必修", "一般", "状況設定", "解剖生理", "基礎看護", "精神"],
      datasets: [
        {
          label: "正答率 (%)",
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderColor: "#3b82f6",
        },
      ],
    };
  }

  const stats: Record<string, { total: number; correct: number }> = {};

  studyLogs.value.forEach((log) => {
    if (log.question && Array.isArray(log.question.tags)) {
      log.question.tags.forEach((tag) => {
        if (!stats[tag]) stats[tag] = { total: 0, correct: 0 };
        stats[tag].total++;
        if (log.isCorrect) stats[tag].correct++;
      });
    }
  });

  let topTags = Object.keys(stats)
    .sort((a, b) => stats[b].total - stats[a].total)
    .slice(0, 6);

  if (topTags.length < 3) {
    const defaults = [
      "必修",
      "一般",
      "状況設定",
      "解剖生理",
      "基礎看護",
      "精神",
    ];
    defaults.forEach((t) => {
      if (!topTags.includes(t)) topTags.push(t);
    });
    topTags = topTags.slice(0, 6);
  }

  const dataValues = topTags.map((tag) => {
    const s = stats[tag];
    if (!s) return 0;
    return Math.round((s.correct / s.total) * 100);
  });

  return {
    labels: topTags,
    datasets: [
      {
        label: "正答率 (%)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "#3b82f6",
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#3b82f6",
        data: dataValues,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      angleLines: { color: "rgba(0, 0, 0, 0.05)" },
      grid: { color: "rgba(0, 0, 0, 0.05)" },
      pointLabels: {
        font: { size: 10, weight: "bold" as const },
        color: "#64748b",
      },
      suggestedMin: 0,
      suggestedMax: 100,
      ticks: { stepSize: 20, display: false },
    },
  },
  plugins: {
    legend: { display: false },
  },
};

const formatDate = (date: any) => {
  if (!date) return "";
  const d =
    date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};
</script>

<template>
  <div class="animate-fade-in">
    <div
      class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 mb-6 relative overflow-hidden"
    >
      <div class="relative z-10">
        <div class="flex justify-between items-start mb-4">
          <div>
            <p
              class="text-[10px] font-bold opacity-70 mb-1 uppercase tracking-wider"
            >
              Current Rank
            </p>
            <h2 class="text-2xl font-black tracking-tight">
              {{ currentRank }}
            </h2>
          </div>
          <div
            class="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10"
          >
            <span class="font-black text-sm">Lv.{{ currentLevel }}</span>
          </div>
        </div>
        <div class="flex justify-between text-xs font-bold opacity-80 mb-2">
          <span>EXP: {{ totalExp }}</span>
          <span>Next: {{ 100 - levelProgress }}xp</span>
        </div>
        <div
          class="w-full bg-black/20 h-3 rounded-full overflow-hidden backdrop-blur-sm border border-white/10"
        >
          <div
            class="bg-yellow-400 h-full rounded-full transition-all duration-1000 ease-out"
            :style="{ width: `${levelProgress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <div
      class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 relative"
    >
      <h3 class="absolute top-4 left-6 text-xs font-bold text-slate-400">
        分野別傾向
      </h3>
      <div class="h-[250px] w-full mt-2">
        <Radar v-if="chartData" :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <div>
      <h3 class="font-bold text-slate-700 text-lg mb-4 px-1">学習履歴</h3>

      <div v-if="loading" class="text-center py-10">
        <div
          class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"
        ></div>
      </div>

      <div
        v-else-if="studyLogs.length === 0"
        class="text-center py-10 text-slate-400"
      >
        <p class="text-3xl mb-2">📝</p>
        <p class="text-xs font-bold">まだ履歴がありません</p>
      </div>

      <div v-else class="max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
        <div class="space-y-3">
          <div
            v-for="log in studyLogs"
            :key="log.id"
            class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 transition hover:border-blue-200"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              :class="
                log.isCorrect
                  ? 'bg-blue-50 text-blue-500'
                  : 'bg-red-50 text-red-500'
              "
            >
              {{ log.isCorrect ? "⭕️" : "❌" }}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-1">
                <span
                  class="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded"
                >
                  {{ formatDate(log.createdAt) }}
                </span>
              </div>
              <p
                class="text-sm font-bold text-slate-700 line-clamp-2 leading-relaxed"
              >
                {{ log.question?.text || "問題文なし" }}
              </p>
              <div class="mt-2 flex gap-1 overflow-hidden">
                <span
                  v-for="tag in log.question?.tags"
                  :key="tag"
                  class="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                  >#{{ tag }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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

/* スクロールバーを非表示にする設定 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
