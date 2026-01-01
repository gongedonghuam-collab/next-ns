import { computed } from "vue";

// 型定義
export interface SalesData {
  label: string;
  amount: number;
}

// Propsのインターフェース定義
// VueコンポーネントのProps型と一致させます
export interface SalesChartProps {
  data: SalesData[];
  period: string;
  color: string;
}

// 期間ラベルの定数
export const PERIODS = [
  { label: "1ヶ月", value: "1m" },
  { label: "3ヶ月", value: "3m" },
  { label: "半年", value: "6m" },
  { label: "1年", value: "1y" },
  { label: "3年", value: "3y" },
  { label: "全期間", value: "all" },
];

// Composable関数 (ロジックの本体)
export function useSalesChart(props: SalesChartProps) {
  // データの最大値を計算（グラフの高さ計算用）
  // 全て0の場合は10000(1万円)にしてゼロ除算を防ぐ
  const maxAmount = computed(() => {
    if (!props.data || props.data.length === 0) return 10000;
    const max = Math.max(...props.data.map((d) => d.amount));
    return max > 0 ? max : 10000;
  });

  // バーの高さを計算 (パーセント)
  const barHeight = (amount: number) => {
    return (amount / maxAmount.value) * 100;
  };

  return {
    barHeight,
  };
}
