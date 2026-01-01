import { ref, watch } from "vue";

export interface SettingsTabProps {
  currentUser: any;
  currentTheme: any;
  THEMES: Record<string, any>;
}

export function useSettingsTab(props: SettingsTabProps) {
  // --- 1. 編集用の変数を定義 ---
  const editName = ref("");
  const editTheme = ref("teal");

  // 新しく追加する項目（サロン名、自己紹介、SNSなど）
  const editSalonName = ref("");
  const editBio = ref("");
  const editInstagram = ref("");
  const editTiktok = ref("");

  // 画像アップロード用
  const editProfileImg = ref<File | null>(null);
  const editHeaderImg = ref<File | null>(null);

  // 画像プレビュー表示用URL
  const profileImgPreview = ref("");
  const headerImgPreview = ref("");

  // --- 2. 親からデータが来たらフォームにセット ---
  watch(
    () => props.currentUser,
    (newVal) => {
      if (newVal) {
        editName.value = newVal.name || "";
        editTheme.value = newVal.themeColor || "teal";
        editSalonName.value = newVal.salonName || "";
        editBio.value = newVal.bio || "";
        editInstagram.value = newVal.instagram || "";
        editTiktok.value = newVal.tiktok || "";

        // すでに保存されている画像URLがあればプレビューにセット
        profileImgPreview.value = newVal.profileImgUrl || "";
        headerImgPreview.value = newVal.headerImgUrl || "";
      }
    },
    { immediate: true }
  );

  // --- 3. 画像が選択された時の処理 ---

  // プロフィール画像が変更されたら
  const onProfileImgChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      // ファイルの実体を保存（保存ボタンを押した時に使う）
      editProfileImg.value = target.files[0];
      // 画面表示用にプレビューURLを作る
      profileImgPreview.value = URL.createObjectURL(target.files[0]);
    }
  };

  // ヘッダー画像が変更されたら
  const onHeaderImgChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      editHeaderImg.value = target.files[0];
      headerImgPreview.value = URL.createObjectURL(target.files[0]);
    }
  };

  return {
    editName,
    editTheme,
    editSalonName,
    editBio,
    editInstagram,
    editTiktok,
    editProfileImg,
    editHeaderImg,
    profileImgPreview,
    headerImgPreview,
    onProfileImgChange,
    onHeaderImgChange,
  };
}
