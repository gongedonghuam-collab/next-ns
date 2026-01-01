// Propsの型定義
export interface TheBottomNavProps {
  currentTheme: any;
  currentTab: string;
  activeClientId: string | null;
  currentUserRole?: string; // ★追加: これがないと在庫ボタンの出し分けができません
}

export function useTheBottomNav() {
  return {};
}
