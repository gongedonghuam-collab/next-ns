import { ref, computed, watch, onMounted } from "vue";
import { useHairLink } from "@/composables/useHairLink";
import type BaseModal from "@/uiParts/BaseModal/BaseModal.vue";
import type ProductScannerModal from "@/components/ProductScannerModal/ProductScannerModal.vue";

export function useInventoryDashboard() {
  const {
    products,
    fetchInventory,
    saveInventoryItem,
    deleteInventoryItem,
    searchProduct, // Yahoo検索機能
    currentUser,
  } = useHairLink();

  const scannerRef = ref<InstanceType<typeof ProductScannerModal> | null>(null);
  const editModalRef = ref<InstanceType<typeof BaseModal> | null>(null);

  const searchText = ref("");
  const isEditing = ref(false);
  const isScanningForForm = ref(false);

  const form = ref({
    code: "",
    name: "",
    stock: 0,
    unitPrice: 0,
  });

  const loadData = () => {
    if (currentUser.value?.isPro) {
      fetchInventory();
    }
  };

  onMounted(() => {
    loadData();
  });

  watch(
    () => currentUser.value,
    (newVal) => {
      if (newVal) loadData();
    }
  );

  const filteredProducts = computed(() => {
    if (!searchText.value) return products.value;
    const lower = searchText.value.toLowerCase();
    return products.value.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.code.includes(lower)
    );
  });

  const openAddModal = () => {
    if (!currentUser.value?.isPro)
      return alert("在庫管理はPROプラン限定の機能です。");
    form.value = { code: "", name: "", stock: 0, unitPrice: 0 };
    isEditing.value = false;
    editModalRef.value?.show();
  };

  const openEditModal = (item: any) => {
    form.value = {
      code: item.code,
      name: item.name,
      stock: item.stock,
      unitPrice: item.unitPrice || 0,
    };
    isEditing.value = true;
    editModalRef.value?.show();
  };

  const openScanner = () => {
    if (!currentUser.value?.isPro)
      return alert("バーコードスキャンはPROプラン限定の機能です。");
    isScanningForForm.value = false;
    scannerRef.value?.show();
  };

  const scanForForm = () => {
    isScanningForForm.value = true;
    scannerRef.value?.show();
  };

  // ★ここがご希望の挙動の核心部分
  const onScan = async (code: string) => {
    // フォーム入力中のスキャンならコードと名前を入れるだけ
    if (isScanningForForm.value) {
      form.value.code = code;
      const name = await searchProduct(code); // Yahoo検索
      if (name) form.value.name = name;
      return;
    }

    // 1. まず在庫リストにあるか探す
    const existing = products.value.find((p) => p.code === code);
    if (existing) {
      // あれば編集画面を開く
      openEditModal(existing);
    } else {
      // 2. なければ新規登録画面を開き、Yahoo検索する
      form.value = { code, name: "検索中...", stock: 1, unitPrice: 0 };
      isEditing.value = false;
      editModalRef.value?.show();

      const name = await searchProduct(code); // Yahoo検索

      // 見つかったら名前を入れる。見つからなければ空欄（手入力させる）
      form.value.name = name || "";
    }
  };

  const saveItem = async () => {
    if (!form.value.code || !form.value.name) {
      alert("商品コードと商品名は必須です");
      return;
    }
    try {
      await saveInventoryItem(
        form.value.code,
        form.value.name,
        form.value.stock,
        form.value.unitPrice
      );
      alert("保存しました");
      editModalRef.value?.close();
    } catch (e) {
      alert("保存に失敗しました");
    }
  };

  const deleteItem = async (code: string) => {
    await deleteInventoryItem(code);
    editModalRef.value?.close();
  };

  return {
    products,
    filteredProducts,
    searchText,
    form,
    isEditing,
    scannerRef,
    editModalRef,
    openAddModal,
    openEditModal,
    openScanner,
    scanForForm,
    onScan,
    saveItem,
    deleteItem,
  };
}
