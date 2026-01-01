<script setup lang="ts">
import { ref, computed, watch } from "vue";
import BaseInput from "@/uiParts/BaseInput/BaseInput.vue";
import { useSettingsTab } from "./SettingsTab";
import type { SettingsTabProps } from "./SettingsTab";
import { useHairLink } from "@/composables/useHairLink";

const props = defineProps<SettingsTabProps>();
const emit = defineEmits(["saved"]);

// 既存のSettingsTabロジック
const {
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
} = useSettingsTab(props);

// HairLink全体ロジック
const {
  createCheckoutSession,
  openCustomerPortal,
  currentUser,
  debugTogglePro,
  uploadFile,
  updateUserProfile,
  autoMessageSettings,
  saveAutoMessageSettings,
  ADMIN_UID,
} = useHairLink();

const isProcessingPayment = ref(false);
const isSaving = ref(false);
const isAutoMessageEnabled = ref(true);
const thanksTemplate = ref("");

// ★修正: URLをcomputedにして、currentUserがロードされたら自動更新されるようにする
const publicPageUrl = computed(() => {
  if (!currentUser.value?.uid) return "読み込み中...";
  return `${window.location.origin}/book/${currentUser.value.uid}`;
});

watch(
  autoMessageSettings,
  (newVal) => {
    if (newVal) {
      isAutoMessageEnabled.value = newVal.enabled !== false;
      thanksTemplate.value = newVal.template || "";
    }
  },
  { immediate: true }
);

const handleSubscribe = async () => {
  isProcessingPayment.value = true;
  try {
    await createCheckoutSession();
  } catch (e) {
    isProcessingPayment.value = false;
  }
};

const handleSaveProfile = async () => {
  isSaving.value = true;
  try {
    let profileUrl = currentUser.value?.profileImgUrl;
    let headerUrl = currentUser.value?.headerImgUrl;

    if (editProfileImg.value) {
      profileUrl = await uploadFile(
        `profiles/${currentUser.value.uid}/avatar_${Date.now()}`,
        editProfileImg.value
      );
    }
    if (editHeaderImg.value) {
      headerUrl = await uploadFile(
        `profiles/${currentUser.value.uid}/header_${Date.now()}`,
        editHeaderImg.value
      );
    }

    const data = {
      name: editName.value,
      themeColor: editTheme.value,
      salonName: editSalonName.value,
      bio: editBio.value,
      instagram: editInstagram.value,
      tiktok: editTiktok.value,
      profileImgUrl: profileUrl || null,
      headerImgUrl: headerUrl || null,
    };

    await updateUserProfile(currentUser.value.uid, data);
    alert("プロフィールを保存しました✨");
    emit("saved", data);
  } catch (e) {
    console.error(e);
    alert("保存に失敗しました");
  } finally {
    isSaving.value = false;
  }
};

const handleSaveAutoMessage = async () => {
  if (!isAutoMessageEnabled.value && !confirm("自動送信をOFFにしますか？"))
    return;
  isSaving.value = true;
  try {
    await saveAutoMessageSettings({
      enabled: isAutoMessageEnabled.value,
      template: thanksTemplate.value,
    });
    alert("自動メッセージ設定を保存しました💌");
  } catch (e) {
    alert("設定の保存に失敗しました");
  } finally {
    isSaving.value = false;
  }
};

const copyPublicLink = () => {
  if (!currentUser.value?.uid) return;
  navigator.clipboard.writeText(publicPageUrl.value);
  alert("URLをコピーしました！");
};

// ★追加: ページを開く関数
const openPublicLink = () => {
  if (!currentUser.value?.uid) return;
  window.open(publicPageUrl.value, "_blank");
};
</script>

<template>
  <div class="pb-24 space-y-8">
    <div v-if="currentUser?.role === 'stylist'" class="space-y-8">
      <div class="modern-card p-6 relative overflow-hidden bg-white">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-slate-800"></div>
        <h3
          class="font-bold text-slate-800 text-base mb-4 flex items-center gap-2"
        >
          <span>🔗</span> 予約ページURL
        </h3>
        <p class="text-xs text-slate-500 mb-4 leading-relaxed">
          インスタのプロフィールにこのURLを貼り付けると、お客様がWeb予約できるようになります。
        </p>
        <div class="flex gap-2">
          <div
            class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-600 truncate select-all"
          >
            {{ publicPageUrl }}
          </div>
          <button
            @click="copyPublicLink"
            class="bg-slate-800 text-white text-xs font-bold px-4 rounded-xl hover:bg-slate-700 transition"
          >
            Copy
          </button>
          <button
            @click="openPublicLink"
            class="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 rounded-xl hover:bg-slate-50 transition"
          >
            Open
          </button>
        </div>
      </div>

      <div
        class="modern-card p-6 bg-gradient-to-br from-[#F0FAF4] to-white border-[#06C755]/20"
      >
        <div class="flex justify-between items-center mb-4">
          <h3
            class="font-bold text-slate-800 text-base flex items-center gap-2"
          >
            <span class="text-xl">💬</span> 自動サンクスLINE
          </h3>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="isAutoMessageEnabled"
              class="sr-only peer"
            />
            <div
              class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06C755]"
            ></div>
          </label>
        </div>
        <p class="text-xs text-slate-500 mb-4 leading-relaxed">
          カルテ保存時にお客様へ送るお礼メッセージ。<br />
          <span
            class="font-bold bg-white px-1 rounded border border-slate-200 mx-1"
            >{name}</span
          >
          と書くとお客様の名前に変換されます。
        </p>
        <div class="mb-4">
          <textarea
            v-model="thanksTemplate"
            rows="6"
            class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-green-500/20 resize-none shadow-sm placeholder:text-slate-300"
            placeholder="メッセージテンプレートを入力..."
          ></textarea>
        </div>
        <button
          @click="handleSaveAutoMessage"
          :disabled="isSaving"
          class="w-full py-3 rounded-xl font-bold text-xs bg-[#06C755] text-white hover:bg-[#05b34c] transition shadow-md active:scale-95 disabled:opacity-50"
        >
          {{ isSaving ? "保存中..." : "メッセージ設定を保存" }}
        </button>
      </div>

      <div class="modern-card p-6 bg-white">
        <h3
          class="font-bold text-slate-800 text-base mb-6 flex items-center gap-2"
        >
          <span>🎨</span> ページデザイン設定
        </h3>
        <div class="space-y-6">
          <div>
            <label
              class="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider"
              >Cover Image</label
            >
            <div
              class="relative w-full h-32 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 cursor-pointer group hover:border-slate-300 transition"
            >
              <img
                v-if="headerImgPreview"
                :src="headerImgPreview"
                class="w-full h-full object-cover"
              />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition"
              >
                <span
                  class="text-white font-bold text-xs bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm"
                  >📷 変更</span
                >
              </div>
              <input
                type="file"
                accept="image/*"
                class="absolute inset-0 opacity-0 cursor-pointer"
                @change="onHeaderImgChange"
              />
            </div>
          </div>
          <div class="flex gap-5">
            <div class="relative w-20 h-20 flex-shrink-0">
              <div
                class="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group relative shadow-sm"
              >
                <img
                  v-if="profileImgPreview"
                  :src="profileImgPreview"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-slate-300 text-3xl"
                >
                  ☺
                </div>
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition"
                >
                  <span class="text-white text-xs">📷</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  @change="onProfileImgChange"
                />
              </div>
            </div>
            <div class="flex-1 space-y-4">
              <div>
                <label
                  class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider"
                  >Stylist Name</label
                >
                <BaseInput v-model="editName" placeholder="例: 美容 師太郎" />
              </div>
              <div>
                <label
                  class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider"
                  >Salon Name</label
                >
                <BaseInput
                  v-model="editSalonName"
                  placeholder="例: HairLink Omotesando"
                />
              </div>
            </div>
          </div>
          <div>
            <label
              class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider"
              >Bio</label
            >
            <textarea
              v-model="editBio"
              rows="3"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 resize-none placeholder:text-slate-300"
              placeholder="得意なスタイルやメッセージを入力してください"
            ></textarea>
          </div>
          <div>
            <label
              class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider"
              >Social Links</label
            >
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <span class="text-xl w-6 text-center">📸</span
                ><BaseInput
                  v-model="editInstagram"
                  placeholder="Instagram ID (@なし)"
                />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xl w-6 text-center">🎵</span
                ><BaseInput
                  v-model="editTiktok"
                  placeholder="TikTok ID (@なし)"
                />
              </div>
            </div>
          </div>
          <div>
            <label
              class="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider"
              >Theme Color</label
            >
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="(theme, key) in props.THEMES"
                :key="key"
                @click="editTheme = String(key)"
                class="flex items-center gap-3 p-2.5 rounded-xl border transition relative overflow-hidden"
                :class="[
                  editTheme === key
                    ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800'
                    : 'border-slate-100 bg-white hover:border-slate-300',
                ]"
              >
                <div
                  class="w-5 h-5 rounded-full shadow-sm flex items-center justify-center text-white font-bold text-[10px]"
                  :class="theme.accent"
                >
                  <span v-if="editTheme === key">✓</span>
                </div>
                <span class="text-xs font-bold text-slate-600">{{
                  theme.name
                }}</span>
              </button>
            </div>
          </div>
          <button
            @click="handleSaveProfile"
            :disabled="isSaving"
            class="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg active:scale-95 disabled:opacity-50"
          >
            {{ isSaving ? "保存中..." : "プロフィールを更新" }}
          </button>
        </div>
      </div>

      <div
        class="modern-card p-0 overflow-hidden bg-slate-900 text-white relative"
      >
        <div
          class="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"
        ></div>
        <div class="p-8 relative z-10">
          <div class="flex justify-between items-start mb-2">
            <p
              class="text-[10px] font-bold text-slate-400 tracking-widest uppercase"
            >
              Current Plan
            </p>
            <span
              v-if="!currentUser?.isPro"
              class="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-rose-500/50"
              >First Month Free</span
            >
            <span
              v-else
              class="bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-teal-500/50"
              >PRO ACTIVE</span
            >
          </div>
          <div class="flex items-end gap-3 mb-6">
            <h2 class="text-3xl font-black tracking-tighter">
              {{ currentUser?.isPro ? "PRO Plan" : "Free Plan" }}
            </h2>
          </div>
          <div v-if="!currentUser?.isPro">
            <p class="text-xs text-slate-300 mb-6 leading-relaxed">
              在庫管理やWeb予約機能を制限なく利用できます。<br />初月無料で、いつでもキャンセル可能です。
            </p>
            <button
              @click="handleSubscribe"
              :disabled="isProcessingPayment"
              class="w-full py-4 rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-100 transition shadow-xl flex flex-col items-center justify-center gap-0.5 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
            >
              <div v-if="isProcessingPayment" class="flex items-center gap-2">
                <div
                  class="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"
                ></div>
                <span class="text-sm">Processing...</span>
              </div>
              <div v-else class="text-center">
                <span class="text-sm block">30日間無料でアップグレード</span
                ><span class="text-[9px] font-normal text-slate-500"
                  >月額 ¥2,980 / いつでも解約可能</span
                >
              </div>
            </button>
          </div>
          <div v-else>
            <p class="text-xs text-slate-300 mb-4">
              HairLinkをご利用いただきありがとうございます。<br />全ての機能が有効化されています。
            </p>
            <button
              @click="openCustomerPortal"
              class="text-xs text-slate-400 underline hover:text-white transition"
            >
              サブスクリプションの管理・解約
            </button>
          </div>
          <button
            v-if="currentUser?.uid === ADMIN_UID"
            @click="debugTogglePro"
            class="mt-6 text-[9px] text-slate-600 border border-slate-700 px-2 py-1 rounded hover:text-white hover:border-white transition block mx-auto opacity-50 hover:opacity-100"
          >
            🔧 開発者用: Pro切替
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="currentUser?.role === 'customer'"
      class="modern-card p-6 bg-white"
    >
      <h3 class="font-bold text-slate-800 text-lg mb-6">アカウント設定</h3>
      <div class="mb-6">
        <label
          class="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider"
          >お名前</label
        >
        <BaseInput v-model="editName" placeholder="お名前を入力" />
      </div>
      <button
        @click="handleSaveProfile"
        :disabled="isSaving"
        class="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg active:scale-95 disabled:opacity-50"
      >
        {{ isSaving ? "保存中..." : "変更を保存" }}
      </button>
    </div>
  </div>
</template>
