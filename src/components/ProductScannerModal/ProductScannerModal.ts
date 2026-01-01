import { ref, nextTick } from "vue";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import type BaseModal from "@/uiParts/BaseModal/BaseModal.vue";

// ★修正: emit の型を any にして、型エラーを回避する
export function ProductScannerModal(emit: any) {
  const baseModalRef = ref<InstanceType<typeof BaseModal> | null>(null);
  const scannerContainerId = "product-barcode-reader";
  let html5QrCode: Html5Qrcode | null = null;
  const isScanning = ref(false);

  const startScan = async () => {
    if (isScanning.value) return;

    await nextTick();

    setTimeout(async () => {
      try {
        const element = document.getElementById(scannerContainerId);
        if (!element) return;

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

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 }, // バーコード用に横長
          aspectRatio: 1.0,
          // 一般的な商品バーコード（JAN/EAN）に対応
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            stopScan();
            emit("detect", decodedText);
            baseModalRef.value?.close();
          },
          (errorMessage) => {
            // 読み取り中のエラーは無視
          }
        );
      } catch (err) {
        console.error("カメラー起動エラー", err);
        alert("カメラの起動に失敗しました。");
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
        console.error(e);
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
