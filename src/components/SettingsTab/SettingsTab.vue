<template>
  <div class="pb-32 animate-fade-in">
    <div
      class="bg-white p-6 rounded-b-[40px] shadow-sm border-b border-slate-100 mb-6"
    >
      <h2
        class="text-xl font-black text-slate-800 flex items-center gap-2 mb-1"
      >
        ⚙️ Settings
      </h2>
      <p class="text-xs text-slate-400 font-bold">アカウント設定・その他</p>
    </div>

    <div class="px-6 space-y-6">
      <section
        class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
      >
        <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
          👤 プロフィール設定
        </h3>

        <div class="space-y-4">
          <div>
            <label
              class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest"
              >現在の名前</label
            >
            <div class="flex items-center gap-2">
              <span class="font-black text-lg text-slate-800">{{
                currentUser?.displayName || "名無しナース"
              }}</span>
            </div>
          </div>

          <div>
            <label
              class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest"
              >新しい名前</label
            >
            <div class="flex gap-2">
              <input
                v-model="newName"
                type="text"
                placeholder="例: ナイチンゲール"
                class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                @click="updateName"
                :disabled="loading || !newName"
                class="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-100 active:scale-95"
              >
                {{ loading ? "..." : "変更" }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-3"
      >
        <h3 class="font-bold text-slate-700 mb-2">💳 アカウント情報</h3>
        <div
          class="flex justify-between items-center text-xs font-bold border-b border-slate-100 pb-3"
        >
          <span class="text-slate-400">メールアドレス</span>
          <span class="text-slate-600">{{ currentUser?.email }}</span>
        </div>
        <div
          class="flex justify-between items-center text-xs font-bold border-b border-slate-100 pb-3"
        >
          <span class="text-slate-400">ユーザーID</span>
          <span class="text-slate-400 font-mono text-[10px]"
            >{{ currentUser?.uid.slice(0, 8) }}...</span
          >
        </div>
        <div class="flex justify-between items-center text-xs font-bold">
          <span class="text-slate-400">登録日</span>
          <span class="text-slate-600">{{
            formatDate(currentUser?.createdAt)
          }}</span>
        </div>
      </section>

      <button
        @click="handleLogout"
        class="w-full py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition active:scale-95"
      >
        ログアウト
      </button>

      <p class="text-center text-[10px] font-bold text-slate-300 pt-4">
        NextNs v1.0.0
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useNextNs } from "@/composables/useNextNs";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

const { currentUser, logout } = useNextNs();
const newName = ref("");
const loading = ref(false);

const updateName = async () => {
  if (!newName.value || !auth.currentUser || !currentUser.value) return;

  loading.value = true;
  try {
    await updateProfile(auth.currentUser, { displayName: newName.value });

    const userRef = doc(db, "users", currentUser.value.uid);
    await updateDoc(userRef, { displayName: newName.value });

    currentUser.value.displayName = newName.value;
    newName.value = "";
    alert("✨ 名前を変更しました！");
  } catch (e: any) {
    alert("エラーが発生しました: " + e.message);
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  if (confirm("ログアウトしますか？")) {
    await logout();
  }
};

const formatDate = (val: any) => {
  if (!val) return "-";
  try {
    const date = val.toDate ? val.toDate() : new Date(val);
    return date.toLocaleDateString("ja-JP");
  } catch (e) {
    return "-";
  }
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    transform: translateY(0);
  }
}
</style>
