import { ref, onMounted } from "vue";
import { useHairLink } from "@/composables/useHairLink";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/firebase";

export interface CustomerDashboardProps {
  currentTheme: any;
  logs: any[];
  myReservation: any;
  currentUser: any;
}

export function useCustomerDashboard() {
  const { cancelReservation, currentUser } = useHairLink();
  const isIdVisible = ref(false);
  const reservationModalRef = ref<any>(null);

  const isLinking = ref(false);
  const isUnlinking = ref(false);

  // LINE DevelopersのチャネルID（既存のものをそのまま使用）
  const LINE_CHANNEL_ID = "2008700821";
  const FIXED_REDIRECT_URI = "https://hair-link-app-ee2a3.web.app/app";

  const toggleIdVisibility = () => {
    isIdVisible.value = !isIdVisible.value;
  };

  const openReservation = () => {
    reservationModalRef.value?.show();
  };

  const onCancelReservation = async (reservationId: string) => {
    await cancelReservation(reservationId);
  };

  // ---------------------------------------------------------
  // LINE連携を開始する
  // ---------------------------------------------------------
  const startLineLink = () => {
    isLinking.value = true;
    const state = Math.random().toString(36).substring(7);

    // ★修正ポイント: bot_prompt=aggressive を指定
    const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(
      FIXED_REDIRECT_URI
    )}&state=${state}&scope=profile%20openid&bot_prompt=aggressive`;
    console.log("生成されたURL:", url); // ★この行を追加！
    window.location.href = url;
  };

  // ---------------------------------------------------------
  // LINE連携を解除する
  // ---------------------------------------------------------
  const unlinkLine = async () => {
    if (!confirm("LINE連携を解除しますか？\n予約通知などが届かなくなります。"))
      return;

    if (!currentUser.value?.uid) return;
    isUnlinking.value = true;

    try {
      const userRef = doc(db, "users", currentUser.value.uid);
      await updateDoc(userRef, {
        isLineLinked: false,
        lineUserId: deleteField(),
        lineDisplayName: deleteField(),
      });

      if (currentUser.value) {
        currentUser.value.isLineLinked = false;
      }
      alert("連携を解除しました。");
    } catch (e) {
      console.error("解除エラー:", e);
      alert("解除に失敗しました。");
    } finally {
      isUnlinking.value = false;
    }
  };

  // ---------------------------------------------------------
  // LINEから戻ってきた時の処理
  // ---------------------------------------------------------
  onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      isLinking.value = true;
      try {
        const functions = getFunctions(undefined, "asia-northeast1");
        const linkLine = httpsCallable(functions, "linkLineAccount");

        await linkLine({ code, redirectUri: FIXED_REDIRECT_URI });

        alert("🎉 LINE連携が完了しました！");
        window.history.replaceState({}, "", window.location.pathname);
        window.location.reload();
      } catch (e: any) {
        console.error(e);
        isLinking.value = false;
        alert(`【連携失敗】\n${e.message}`);
      }
    }
  });

  return {
    isIdVisible,
    toggleIdVisibility,
    reservationModalRef,
    openReservation,
    onCancelReservation,
    startLineLink,
    unlinkLine,
    isLinking,
    isUnlinking,
  };
}
