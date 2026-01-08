<template>
  <div class="animate-fade-in space-y-10">
    <div
      class="bg-white p-5 rounded-3xl shadow-md border border-slate-200 relative mt-4"
    >
      <div
        class="flex items-center gap-2 mb-4 border-l-4 border-indigo-500 pl-3"
      >
        <h3 class="text-sm font-black text-slate-700">分野別傾向</h3>
      </div>
      <div class="h-[250px] w-full">
        <Radar v-if="chartData" :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <div>
      <div
        class="flex items-center gap-2 mb-4 border-l-4 border-indigo-500 pl-3"
      >
        <h3 class="text-lg font-black text-slate-700">学習履歴</h3>
      </div>

      <div v-if="loading" class="text-center py-10">
        <div
          class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"
        ></div>
      </div>

      <div
        v-else-if="studyLogs.length === 0"
        class="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200"
      >
        <p class="text-4xl mb-2">📝</p>
        <p class="text-sm font-bold text-slate-400">まだ履歴がありません</p>
      </div>

      <div v-else class="max-h-[600px] overflow-y-auto pr-1 no-scrollbar p-1">
        <div class="space-y-4">
          <div
            v-for="log in studyLogs"
            :key="log.id"
            @click="router.push(`/question/${log.questionId}?mode=review`)"
            class="p-5 bg-white rounded-2xl shadow border border-slate-200 relative group hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
          >
            <div
              class="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-3"
            >
              <div class="flex items-center gap-2">
                <span
                  class="px-3 py-1 rounded-full border"
                  :class="
                    log.isCorrect
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : 'bg-red-50 text-red-500 border-red-100'
                  "
                >
                  {{ log.isCorrect ? "正解" : "不正解" }}
                </span>
                <span class="bg-slate-100 px-2 py-0.5 rounded">{{
                  formatDate(log.createdAt)
                }}</span>
              </div>
              <span class="font-mono text-slate-300"
                >ID:{{ log.questionId.slice(0, 4) }}</span
              >
            </div>

            <p
              class="text-sm font-bold text-slate-700 leading-relaxed line-clamp-2 mb-4"
            >
              {{ log.question?.text || "問題文なし" }}
            </p>

            <div
              class="flex justify-between items-end border-t border-slate-50 pt-3"
            >
              <div class="flex gap-1 overflow-hidden">
                <span
                  v-for="tag in log.question?.tags?.slice(0, 2)"
                  :key="tag"
                  class="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md"
                  >#{{ tag }}</span
                >
              </div>
              <span
                class="text-[10px] text-indigo-600 font-bold flex items-center gap-1 group-hover:underline"
              >
                解説を見る
                <span
                  class="text-xs transition-transform group-hover:translate-x-1"
                  >→</span
                >
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
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

const router = useRouter();
const { fetchHistory, studyLogs, loading } = useNextNs();

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
          backgroundColor: "rgba(99, 102, 241, 0.2)",
          borderColor: "#6366f1",
          pointBackgroundColor: "#6366f1",
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
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        borderColor: "#6366f1",
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#6366f1",
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
  try {
    const d =
      date instanceof Date
        ? date
        : date.toDate
        ? date.toDate()
        : new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  } catch {
    return "";
  }
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

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
