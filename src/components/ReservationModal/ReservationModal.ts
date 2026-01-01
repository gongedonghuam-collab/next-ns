import { ref, computed, watch } from "vue";
import { useHairLink, type TimeSlot } from "@/composables/useHairLink";
import type BaseModal from "@/uiParts/BaseModal/BaseModal.vue";
import { getAuth } from "firebase/auth";

export const MENU_OPTIONS = [
  "カット",
  "カラー",
  "カット + カラー",
  "パーマ",
  "カット + パーマ",
  "縮毛矯正",
  "トリートメント",
  "ヘッドスパ",
  "カウンセリングのみ",
  "その他",
];

export function useReservationModal(emit: (event: "saved") => void) {
  const { fetchMyStylists, getAvailableSlots, makeReservation, myStylists } =
    useHairLink();
  const auth = getAuth();

  const baseModalRef = ref<InstanceType<typeof BaseModal> | null>(null);
  const loading = ref(false);

  const step = ref(1);
  const selectedStylistId = ref("");
  const selectedDate = ref("");
  const selectedTime = ref("");
  const selectedMenu = ref(MENU_OPTIONS[2]);
  const availableSlots = ref<TimeSlot[]>([]);

  // ★追加: 美容師が顧客の予約を入れるための情報
  const targetCustomer = ref<{ uid: string; name: string } | null>(null);

  const minDate = computed(() => new Date().toISOString().slice(0, 10));

  watch([selectedStylistId, selectedDate], async ([newStylistId, newDate]) => {
    if (!newStylistId || !newDate) {
      availableSlots.value = [];
      return;
    }

    selectedTime.value = "";
    availableSlots.value = [];

    loading.value = true;
    try {
      const slots = await getAvailableSlots(newStylistId, newDate);

      if (slots.length === 0) {
        console.warn(
          "予約枠データの取得に失敗したか、枠がありません。デフォルト枠を表示します。"
        );
        for (let i = 10; i < 22; i++) {
          slots.push({ time: `${i}:00`, isAvailable: true });
          slots.push({ time: `${i}:30`, isAvailable: true });
        }
      }
      availableSlots.value = slots;
    } catch (e) {
      console.error("時間枠取得エラー", e);
      const fallbackSlots = [];
      for (let i = 10; i < 22; i++) {
        fallbackSlots.push({ time: `${i}:00`, isAvailable: true });
        fallbackSlots.push({ time: `${i}:30`, isAvailable: true });
      }
      availableSlots.value = fallbackSlots;
    } finally {
      loading.value = false;
    }
  });

  // ★修正: show関数に引数を追加して、美容師による代理予約に対応
  const show = async (options?: {
    isProxy?: boolean;
    stylistId?: string;
    customer?: { uid: string; name: string };
  }) => {
    // 初期化
    step.value = 1;
    selectedStylistId.value = "";
    selectedDate.value = minDate.value;
    selectedTime.value = "";
    availableSlots.value = [];
    loading.value = false;
    targetCustomer.value = null; // リセット

    baseModalRef.value?.show();

    // ★美容師による代理予約モード
    if (options?.isProxy && options.stylistId && options.customer) {
      targetCustomer.value = options.customer;
      selectedStylistId.value = options.stylistId; // 自分自身をセット
      step.value = 2; // 美容師選択をスキップして日時選択へ
      return;
    }

    // 通常モード（顧客が予約）
    loading.value = true;
    try {
      await fetchMyStylists();
    } finally {
      loading.value = false;
    }

    if (myStylists.value.length === 0) {
      step.value = 0;
    } else if (myStylists.value.length === 1) {
      selectedStylistId.value = myStylists.value[0].id;
      step.value = 2;
    }
  };

  const close = () => {
    baseModalRef.value?.close();
  };

  const selectTime = (time: string) => {
    selectedTime.value = time;
  };

  const nextStep = () => {
    if (step.value === 2 && !selectedTime.value)
      return alert("時間を選択してください");
    step.value++;
  };

  const prevStep = () => {
    step.value--;
  };

  const submitReservation = async () => {
    loading.value = true;
    try {
      if (!selectedStylistId.value)
        throw new Error("美容師IDが設定されていません");

      // ★修正: ターゲット顧客情報を渡す
      await makeReservation(
        {
          stylistId: selectedStylistId.value,
          date: selectedDate.value,
          time: selectedTime.value,
          menu: selectedMenu.value,
        },
        targetCustomer.value || undefined
      );

      alert("予約が完了しました！");
      emit("saved");
      close();
    } catch (e: any) {
      console.error("予約エラー:", e);
      alert(`予約に失敗しました。\n${e.message}`);
    } finally {
      loading.value = false;
    }
  };

  return {
    baseModalRef,
    step,
    loading,
    myStylists,
    selectedStylistId,
    selectedDate,
    selectedTime,
    selectedMenu,
    availableSlots,
    minDate,
    show,
    close,
    selectTime,
    nextStep,
    prevStep,
    submitReservation,
    MENU_OPTIONS,
    targetCustomer, // UI表示用に追加
  };
}
