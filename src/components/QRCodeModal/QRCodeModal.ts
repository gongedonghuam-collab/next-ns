import { ref, onMounted, nextTick } from "vue";
import type BaseModal from "@/uiParts/BaseModal/BaseModal.vue";

// Propsの型定義
export interface QRCodeModalProps {
  uid: string | undefined;
}

export function useQRCodeModal(emit: (event: "close") => void) {
  const baseModalRef = ref<InstanceType<typeof BaseModal> | null>(null);

  // モーダルを開く処理
  const show = () => {
    baseModalRef.value?.show();
  };

  // モーダルを閉じる処理
  const close = () => {
    baseModalRef.value?.close();
    emit("close");
  };

  // QRコード画像のURL生成
  const getQRUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}`;
  };

  // ★重要: 親コンポーネントが v-if で制御している場合、
  // マウントされた直後に show() を呼ばないとモーダルが表示されないため自動で呼ぶ
  onMounted(async () => {
    await nextTick(); // DOMの描画を待つ
    show();
  });

  return {
    baseModalRef,
    show,
    close,
    getQRUrl,
  };
}
