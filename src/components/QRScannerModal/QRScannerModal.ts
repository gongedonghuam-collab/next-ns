import { ref, nextTick } from "vue";
import { Html5Qrcode } from "html5-qrcode";
import BaseModal from "@/uiParts/BaseModal/BaseModal.vue";

// ★修正: emit の型を any にして、Vueの厳密な型定義との競合（オーバーロードエラー）を回避する
export function useQRScannerModal(emit: any) {
  const baseModalRef = ref<InstanceType<typeof BaseModal> | null>(null);
  const scannerContainerId = "qr-reader";
  let html5QrCode: Html5Qrcode | null = null;
  const isScanning = ref(false);

  const startScan = async () => {
    if (isScanning.value) return;

    await nextTick();

    setTimeout(async () => {
      try {
        const element = document.getElementById(scannerContainerId);
        if (!element) throw new Error("Scanner container not found");

        if (html5QrCode) {
          try {
            await html5QrCode.stop();
            html5QrCode.clear();
          } catch (e) {
            // 無視
          }
        }

        html5QrCode = new Html5Qrcode(scannerContainerId);

        isScanning.value = true;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            stopScan();
            // emitはanyなのでエラーが出なくなります
            emit("detect", decodedText);
            baseModalRef.value?.close();
          },
          (errorMessage) => {
            // 無視
          }
        );
      } catch (err) {
        console.error("カメラ起動エラー", err);
        alert("カメラの起動に失敗しました。権限を確認してください。");
        isScanning.value = false;
      }
    }, 300);
  };

  const stopScan = async () => {
    if (html5QrCode && isScanning.value) {
      try {
        await html5QrCode.stop();
        html5QrCode.clear();
      } catch (e) {
        console.error("停止エラー", e);
      }
      isScanning.value = false;
      html5QrCode = null;
    }
  };

  const show = () => {
    baseModalRef.value?.show();
    startScan();
  };

  const close = () => {
    stopScan();
    baseModalRef.value?.close();
    emit("close");
  };

  return {
    baseModalRef,
    scannerContainerId,
    show,
    close,
    stopScan,
  };
}
