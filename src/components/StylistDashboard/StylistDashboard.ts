import { computed } from "vue";

// 親コンポーネント(HomeView)から渡されるPropsの型
export interface StylistDashboardProps {
  currentTheme: any;
  monthlySalesData: any[]; // ←これは使わなくなりますが、型定義として残しておきます
  currentMonthSales: number;
  salesPeriod: string;
  clientsWithSales: any[];
  scanInput: string;
}

// このロジックファイル内で扱う全てのデータの型 (Props + 内部データ)
export interface StylistDashboardLogicProps extends StylistDashboardProps {
  products: any[]; // 在庫データ
  allStylistLogs: any[]; // 全ログデータ（これが主役）
}

export function useStylistDashboard(props: StylistDashboardLogicProps) {
  // 期間選択肢
  const periods = [
    { label: "1ヶ月", value: "1m" },
    { label: "3ヶ月", value: "3m" },
    { label: "半年", value: "6m" },
    { label: "1年", value: "1y" },
    { label: "3年", value: "3y" },
    { label: "全期間", value: "all" },
  ];

  // 最終来店日から90日以上経過しているか判定
  const isDanger = (lastVisit: string) => {
    if (!lastVisit) return false;
    const last = new Date(lastVisit);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 90;
  };

  // 失客予備軍（ご無沙汰かつ次回予約なし）を抽出
  const churnRiskClients = computed(() => {
    if (!props.clientsWithSales) return [];
    return props.clientsWithSales.filter((client) => {
      return isDanger(client.lastVisit) && !client.nextReservation;
    });
  });

  // 営業メッセージをクリップボードにコピー
  const copyInviteMessage = async (clientName: string) => {
    const text = `${clientName}様、お久しぶりです！\nヘアスタイルいかがでしょうか？\n季節の変わり目におすすめのカラーなどもご用意しております✨\nまたのご来店を心よりお待ちしております！\n\n(Web予約はこちらから)\nhttps://hair-link-app.web.app`;

    try {
      await navigator.clipboard.writeText(text);
      alert(
        `「${clientName}」様へのメッセージをコピーしました！\nLINEなどに貼り付けて送信してください。`
      );
    } catch (err) {
      alert("コピーに失敗しました");
    }
  };

  // テーマカラーをHEXコードに変換
  const chartColor = computed(() => {
    const primaryColor = props.currentTheme?.primary || "teal";

    const colorMap: Record<string, string> = {
      teal: "#0d9488", // teal-600
      rose: "#e11d48", // rose-600
      blue: "#2563eb", // blue-600
      stone: "#57534e", // stone-600
    };

    return colorMap[primaryColor] || "#0d9488";
  });

  // 経営分析 (Business Intelligence)
  // ★修正: ここでグラフデータ(monthlySalesData)も一括生成します
  const analytics = computed(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // useHairLinkから渡された最新データを使用
    const logs = props.allStylistLogs || [];
    const inventory = props.products || [];

    // --- 1. KPI集計用のフィルタリング (今月分) ---
    const thisMonthLogs = logs.filter((log) => {
      if (!log.date) return false;
      const d = new Date(log.date);
      return (
        d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth
      );
    });

    // 売上合計
    const totalSales = thisMonthLogs.reduce(
      (sum, log) => sum + (Number(log.price) || 0),
      0
    );

    // 原価合計 (使用した薬剤 × 在庫単価)
    let totalCost = 0;
    thisMonthLogs.forEach((log) => {
      if (log.products && Array.isArray(log.products)) {
        log.products.forEach((usedItem: any) => {
          const productMaster = inventory.find((p) => p.code === usedItem.code);
          const unitPrice = productMaster?.unitPrice || 0;
          const quantity = usedItem.quantity || 1;
          totalCost += unitPrice * quantity;
        });
      }
    });

    // 粗利
    const grossProfit = totalSales - totalCost;

    // 利益率
    const profitMargin =
      totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : "0.0";

    // 客単価
    const customerCount = thisMonthLogs.length;
    const avgPrice =
      customerCount > 0 ? Math.round(totalSales / customerCount) : 0;

    // --- 2. グラフ用データの生成 (過去12ヶ月分) ---
    const chartDataMap = new Map<string, number>();

    // 直近12ヶ月の枠を作る (例: "2023-10" 〜 "2024-09")
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      chartDataMap.set(key, 0);
    }

    // ログを集計
    logs.forEach((log) => {
      if (!log.date) return;
      // "2024-09-15" -> "2024-09"
      const monthKey = log.date.substring(0, 7);
      if (chartDataMap.has(monthKey)) {
        chartDataMap.set(
          monthKey,
          (chartDataMap.get(monthKey) || 0) + (Number(log.price) || 0)
        );
      }
    });

    // 配列に変換 (SalesChartが期待する形式: { label: '9月', amount: 50000 })
    // ★修正: プロパティ名を name/pl から label/amount に変更
    const monthlySalesData = Array.from(chartDataMap.entries()).map(
      ([key, value]) => {
        const [_, month] = key.split("-");
        return {
          label: `${parseInt(month)}月`,
          amount: value,
        };
      }
    );

    return {
      totalSales,
      totalCost,
      grossProfit,
      profitMargin,
      avgPrice,
      customerCount,
      monthlySalesData, // ★追加: ここで生成したグラフデータを返す
    };
  });

  return {
    periods,
    isDanger,
    chartColor,
    churnRiskClients,
    copyInviteMessage,
    analytics,
  };
}
