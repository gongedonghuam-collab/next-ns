<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import SalesChart from "@/components/SalesChart/SalesChart.vue";

const props = defineProps<{
  allLogs: any[];
  monthlySalesData?: any[];
  salesPeriod?: string;
  chartColor?: string;
}>();

const emit = defineEmits(["update:salesPeriod"]);

// --- 状態管理 ---
const techSales = ref(0);
const productSales = ref(0);
const techRate = ref(40);
const productRate = ref(10);
const expenses = ref({ rent: 0, materials: 0, ads: 0, other: 0 });
const taxRate = ref(10);

const syncStatus = ref<"idle" | "syncing" | "done">("idle");

// --- グラフ用カラー変換 ---
const hexColor = computed(() => {
  const map: Record<string, string> = {
    "bg-teal-600": "#0d9488",
    "bg-rose-500": "#f43f5e",
    "bg-blue-600": "#2563eb",
    "bg-stone-700": "#44403c",
  };
  return map[props.chartColor || "bg-teal-600"] || "#0d9488";
});

// --- 計算ロジック ---
const calculateSalesFromLogs = async () => {
  syncStatus.value = "syncing";
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!props.allLogs || props.allLogs.length === 0) {
    showDoneStatus();
    return;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let tSales = 0;
  let pSales = 0;

  props.allLogs.forEach((log) => {
    if (!log.date) return;
    const d = new Date(log.date);
    if (d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth) {
      const price = Number(log.price) || 0;
      if (log.salesType === "product") {
        pSales += price;
      } else {
        tSales += price;
      }
    }
  });

  techSales.value = tSales;
  productSales.value = pSales;
  showDoneStatus();
};

const showDoneStatus = () => {
  syncStatus.value = "done";
  setTimeout(() => {
    syncStatus.value = "idle";
  }, 2000);
};

// 初期ロード
watch(
  () => props.allLogs,
  () => {
    if (props.allLogs.length > 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      let tSales = 0;
      let pSales = 0;
      props.allLogs.forEach((log) => {
        if (!log.date) return;
        const d = new Date(log.date);
        if (
          d.getFullYear() === currentYear &&
          d.getMonth() + 1 === currentMonth
        ) {
          const price = Number(log.price) || 0;
          if (log.salesType === "product") pSales += price;
          else tSales += price;
        }
      });
      techSales.value = tSales;
      productSales.value = pSales;
    }
  },
  { immediate: true }
);

onMounted(() => {
  const savedSettings = localStorage.getItem("hairlink_accounting_settings");
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    techRate.value = parsed.techRate || 40;
    productRate.value = parsed.productRate || 10;
    taxRate.value = parsed.taxRate || 10;
    if (parsed.expenses) expenses.value = parsed.expenses;
  }
});

watch(
  [techRate, productRate, taxRate, expenses],
  () => {
    localStorage.setItem(
      "hairlink_accounting_settings",
      JSON.stringify({
        techRate: techRate.value,
        productRate: productRate.value,
        taxRate: taxRate.value,
        expenses: expenses.value,
      })
    );
  },
  { deep: true }
);

// --- 報酬計算 ---
const techReward = computed(() =>
  Math.floor(techSales.value * (techRate.value / 100))
);
const productReward = computed(() =>
  Math.floor(productSales.value * (productRate.value / 100))
);
const totalRevenue = computed(() => techReward.value + productReward.value);
const totalSalesVal = computed(() => techSales.value + productSales.value);
const totalExpenses = computed(() => {
  return (
    Number(expenses.value.rent) +
    Number(expenses.value.materials) +
    Number(expenses.value.ads) +
    Number(expenses.value.other)
  );
});
const operatingIncome = computed(
  () => totalRevenue.value - totalExpenses.value
);
const taxAmount = computed(() =>
  Math.floor(operatingIncome.value * (taxRate.value / 100))
);
const netIncome = computed(() => operatingIncome.value - taxAmount.value);

const handleDownload = () => {
  const data = [
    ["項目", "金額", "備考"],
    ["技術売上", techSales.value, `歩合${techRate.value}%`],
    ["店販売上", productSales.value, `歩合${productRate.value}%`],
    ["報酬総額", totalRevenue.value, "-"],
    ["経費計", totalExpenses.value, "-"],
    ["営業利益", operatingIncome.value, "報酬 - 経費"],
    ["税金積立", taxAmount.value, `設定${taxRate.value}%`],
    ["【最終手取り】", netIncome.value, "自由になるお金"],
  ];
  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    data.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const today = new Date().toISOString().slice(0, 7);
  link.setAttribute("download", `収支管理表_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="space-y-6">
    <div
      class="bg-stone-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden"
    >
      <div class="relative z-10">
        <div class="flex justify-between items-start mb-2">
          <p class="text-xs text-stone-400 font-bold tracking-widest">
            今月の総売上 (TOTAL)
          </p>
          <div
            class="text-[10px] bg-stone-700 px-2 py-1 rounded text-stone-300"
          >
            税込・自動集計
          </div>
        </div>
        <div class="text-4xl font-bold tracking-tight mb-4">
          ¥{{ totalSalesVal.toLocaleString() }}
        </div>
        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-stone-700">
          <div>
            <p class="text-[10px] text-stone-400 mb-1">技術売上</p>
            <p class="font-bold text-lg">¥{{ techSales.toLocaleString() }}</p>
          </div>
          <div>
            <p class="text-[10px] text-stone-400 mb-1">店販売上</p>
            <p class="font-bold text-lg">
              ¥{{ productSales.toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"
      ></div>
    </div>

    <div class="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-stone-700 text-sm">売上推移 (Trends)</h3>
      </div>
      <div class="w-full h-[250px] relative">
        <SalesChart
          v-if="monthlySalesData && monthlySalesData.length > 0"
          :data="monthlySalesData"
          :period="salesPeriod || '6m'"
          :color="hexColor"
          @update:period="emit('update:salesPeriod', $event)"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-stone-300 text-xs"
        >
          データがありません
        </div>
      </div>
    </div>

    <div
      class="bg-gradient-to-br from-stone-800 to-stone-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
    >
      <div class="relative z-10">
        <p class="text-[10px] font-bold text-stone-400 mb-1 tracking-widest">
          手取り見込み (PROFIT)
        </p>
        <div class="flex items-end gap-1 mb-4">
          <span class="text-4xl font-bold tracking-tight"
            >¥{{ netIncome.toLocaleString() }}</span
          >
          <span class="text-sm font-bold text-stone-400 mb-1"
            >/ 自由なお金</span
          >
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-white/10 p-2 rounded-lg">
            <span class="block text-stone-400 text-[10px]"
              >営業利益 (報酬-経費)</span
            >
            <span class="font-bold"
              >¥{{ operatingIncome.toLocaleString() }}</span
            >
          </div>
          <div class="bg-white/10 p-2 rounded-lg">
            <span class="block text-stone-400 text-[10px]"
              >積立 (-{{ taxRate }}%)</span
            >
            <span class="font-bold text-yellow-400"
              >-¥{{ taxAmount.toLocaleString() }}</span
            >
          </div>
        </div>
      </div>
      <div
        class="absolute -right-4 -bottom-4 w-32 h-32 bg-teal-500 opacity-20 rounded-full blur-3xl"
      ></div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-stone-700 text-sm flex items-center gap-2">
          <span>💰</span> 売上・歩合設定
        </h3>

        <button
          @click="calculateSalesFromLogs"
          :disabled="syncStatus !== 'idle'"
          class="text-[10px] font-bold px-3 py-1.5 rounded-full transition flex items-center gap-1 shadow-sm border"
          :class="{
            'bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100 active:scale-95':
              syncStatus === 'idle',
            'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed':
              syncStatus === 'syncing',
            'bg-green-100 text-green-700 border-green-200':
              syncStatus === 'done',
          }"
        >
          <span v-if="syncStatus === 'syncing'" class="animate-spin">⏳</span>
          <span v-else-if="syncStatus === 'done'">✨</span>
          <span v-else>🔄</span>
          <span>{{
            syncStatus === "syncing"
              ? "集計中..."
              : syncStatus === "done"
              ? "完了"
              : "最新データを取得"
          }}</span>
        </button>
      </div>

      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <label class="block text-[10px] font-bold text-stone-400 mb-1"
              >技術売上 (自動+手入力)</label
            >
            <div class="relative">
              <div
                class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold pointer-events-none"
              >
                ¥ {{ techSales.toLocaleString() }}
              </div>
              <input
                type="number"
                v-model="techSales"
                placeholder="0"
                class="w-full bg-stone-50 border border-stone-200 rounded-lg pl-3 pr-24 py-3 font-bold text-stone-700 outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>
          <div class="w-20">
            <label class="block text-[10px] font-bold text-stone-400 mb-1"
              >歩合%</label
            >
            <input
              type="number"
              v-model="techRate"
              class="w-full bg-white border border-stone-200 rounded-lg px-2 py-3 font-bold text-right outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex-1">
            <label class="block text-[10px] font-bold text-stone-400 mb-1"
              >店販売上 (自動+手入力)</label
            >
            <div class="relative">
              <div
                class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold pointer-events-none"
              >
                ¥ {{ productSales.toLocaleString() }}
              </div>
              <input
                type="number"
                v-model="productSales"
                placeholder="0"
                class="w-full bg-stone-50 border border-stone-200 rounded-lg pl-3 pr-24 py-3 font-bold text-stone-700 outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>
          <div class="w-20">
            <label class="block text-[10px] font-bold text-stone-400 mb-1"
              >歩合%</label
            >
            <input
              type="number"
              v-model="productRate"
              class="w-full bg-white border border-stone-200 rounded-lg px-2 py-3 font-bold text-right outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      <div
        class="mt-6 pt-4 border-t border-dashed border-stone-200 flex justify-between items-center text-sm"
      >
        <span class="font-bold text-stone-500">報酬総額</span>
        <span class="font-bold text-stone-800 text-lg"
          >¥{{ totalRevenue.toLocaleString() }}</span
        >
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5">
      <h3 class="font-bold text-stone-700 text-sm flex items-center gap-2 mb-4">
        <span>💸</span> 経費入力 (マイナス分)
      </h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-[10px] font-bold text-stone-400"
            >家賃・場所代</label
          ><input
            type="number"
            v-model="expenses.rent"
            class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 font-bold text-stone-700 outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label class="text-[10px] font-bold text-stone-400">材料費</label
          ><input
            type="number"
            v-model="expenses.materials"
            class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 font-bold text-stone-700 outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label class="text-[10px] font-bold text-stone-400">広告宣伝費</label
          ><input
            type="number"
            v-model="expenses.ads"
            class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 font-bold text-stone-700 outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label class="text-[10px] font-bold text-stone-400">その他</label
          ><input
            type="number"
            v-model="expenses.other"
            class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 font-bold text-stone-700 outline-none focus:border-teal-500"
          />
        </div>
      </div>
      <div
        class="mt-4 pt-4 border-t border-dashed border-stone-200 flex justify-between items-center text-sm"
      >
        <span class="font-bold text-stone-500">経費合計</span>
        <span class="font-bold text-red-500"
          >- ¥{{ totalExpenses.toLocaleString() }}</span
        >
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold text-stone-700 text-sm">
          🏛 積立設定 (税金・貯金)
        </h3>
        <span class="font-bold text-lg text-stone-800">{{ taxRate }}%</span>
      </div>
      <input
        type="range"
        v-model="taxRate"
        min="0"
        max="50"
        step="5"
        class="w-full accent-stone-700 cursor-pointer"
      />
    </div>

    <button
      @click="handleDownload"
      class="w-full bg-stone-800 hover:bg-stone-700 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
    >
      <span>📥</span> 収支データをCSVで保存
    </button>
  </div>
</template>
