import { ref, computed } from "vue";
import { useHairLink } from "@/composables/useHairLink";
import type BaseModal from "@/uiParts/BaseModal/BaseModal.vue";
import type ProductScannerModal from "@/components/ProductScannerModal/ProductScannerModal.vue";
import { getFunctions, httpsCallable } from "firebase/functions"; // 追加

export interface NewLogModalProps {
  currentUser: any;
  currentTheme: any;
  targetCustomerId: string | null;
  targetConnectionId: string | null;
}

interface Product {
  code: string;
  name: string;
  quantity: number;
}

export function useNewLogModal(
  props: NewLogModalProps,
  emit: (event: "saved") => void
) {
  const { addLog, searchProduct, consumeStock, products } = useHairLink();

  const baseModalRef = ref<InstanceType<typeof BaseModal> | null>(null);
  const scannerRef = ref<InstanceType<typeof ProductScannerModal> | null>(null);

  // フォームデータ
  const form = ref({
    salonName: "",
    menu: "",
    memo: "", // ここにAIの「技術カルテ」が入る
    price: "" as string | number,
    salesType: "tech" as "tech" | "product",
    date: new Date().toISOString().slice(0, 10),
    products: [] as Product[],
    customLineMessage: "", // ★追加: ここにAIの「LINEメッセージ」が入る
  });

  // AI関連の状態
  const isAiMode = ref(false); // AIモードかどうか
  const roughNote = ref(""); // 雑なメモ
  const isAiGenerating = ref(false); // 生成中フラグ

  const manualCode = ref("");
  const selectedFiles = ref<File[]>([]);
  const previewUrls = computed(() =>
    selectedFiles.value.map((file) => URL.createObjectURL(file))
  );
  const isSaving = ref(false);
  const isSearchingProduct = ref(false);

  const show = () => {
    baseModalRef.value?.show();
    // 初期化
    form.value = {
      salonName: "",
      menu: "",
      memo: "",
      price: "",
      salesType: "tech",
      date: new Date().toISOString().slice(0, 10),
      products: [],
      customLineMessage: "",
    };
    manualCode.value = "";
    selectedFiles.value = [];
    isAiMode.value = false;
    roughNote.value = "";
  };

  const close = () => baseModalRef.value?.close();

  const onFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files)
      selectedFiles.value = [
        ...selectedFiles.value,
        ...Array.from(target.files),
      ];
    target.value = "";
  };

  const removeFile = (index: number) => selectedFiles.value.splice(index, 1);
  const openScanner = () => scannerRef.value?.show();

  // --- AI生成処理 ---
  const generateMagicKarte = async () => {
    if (!roughNote.value.trim()) return alert("メモを入力してください");
    isAiGenerating.value = true;

    try {
      const functions = getFunctions(undefined, "asia-northeast1");
      const getAiRecommendation = httpsCallable(
        functions,
        "getAiRecommendation"
      );

      const response: any = await getAiRecommendation({
        roughNote: roughNote.value,
      });
      const data = JSON.parse(response.data.rawText);

      // 生成結果をフォームに反映
      form.value.memo = data.technical || "";
      form.value.customLineMessage = data.line || "";

      // AIモードを閉じて確認画面（通常フォーム）へ
      isAiMode.value = false;
    } catch (e: any) {
      console.error("AI Error:", e);
      alert("AI生成に失敗しました: " + e.message);
    } finally {
      isAiGenerating.value = false;
    }
  };

  // -----------------

  const onProductDetected = async (code: string) => {
    if (form.value.products.some((p) => p.code === code)) {
      alert("この商品は既に追加されています");
      return;
    }
    let productName = "";
    const localProduct = products.value.find((p) => p.code === code);

    if (localProduct) {
      productName = localProduct.name;
    } else {
      isSearchingProduct.value = true;
      productName = await searchProduct(code);
      isSearchingProduct.value = false;
    }

    if (!productName) {
      const userInput = prompt(
        `商品名が見つかりませんでした(Code: ${code})。\n登録する商品名を入力してください:`
      );
      if (userInput) {
        productName = userInput;
      } else {
        return;
      }
    }
    form.value.products.push({ code, name: productName, quantity: 1 });
  };

  const addManualProduct = async () => {
    if (!manualCode.value) return;
    await onProductDetected(manualCode.value);
    manualCode.value = "";
  };

  const removeProduct = (index: number) => {
    form.value.products.splice(index, 1);
  };

  const handleSubmit = async () => {
    if (!form.value.menu) {
      alert("「メニュー」を選択してください。");
      return;
    }

    let targetId =
      props.currentUser?.role === "customer"
        ? props.currentUser.uid
        : props.targetCustomerId;
    if (!targetId) return alert("保存先のユーザーが特定できませんでした。");

    isSaving.value = true;
    try {
      const productNote =
        form.value.products.length > 0
          ? `\n\n【使用薬剤・販売】\n${form.value.products
              .map((p) => `・${p.name} (×${p.quantity})`)
              .join("\n")}`
          : "";

      const logData = {
        ...form.value,
        memo: form.value.memo + productNote,
        products: form.value.products,
        price: Number(form.value.price) || 0,
        customerId: targetId,
        // customLineMessage もそのまま保存される（Backendがこれを見て送信する）
      };

      await addLog(
        logData,
        selectedFiles.value,
        props.targetConnectionId || undefined
      );

      if (
        props.currentUser?.role === "stylist" &&
        form.value.products.length > 0
      ) {
        for (const product of form.value.products) {
          await consumeStock(product.code, product.name, product.quantity);
        }
      }

      alert("記録を保存し、LINEを送信しました！");
      emit("saved");
      close();
    } catch (e: any) {
      console.error(e);
      alert("保存に失敗しました");
    } finally {
      isSaving.value = false;
    }
  };

  return {
    baseModalRef,
    scannerRef,
    form,
    manualCode,
    selectedFiles,
    previewUrls,
    isSaving,
    isSearchingProduct,
    show,
    close,
    onFileChange,
    removeFile,
    handleSubmit,
    openScanner,
    onProductDetected,
    addManualProduct,
    removeProduct,
    // AI関連
    isAiMode,
    roughNote,
    isAiGenerating,
    generateMagicKarte,
  };
}
