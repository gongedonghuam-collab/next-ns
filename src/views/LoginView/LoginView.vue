<script setup lang="ts">
import { ref } from "vue";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useRouter } from "vue-router";

const router = useRouter();
const isLoginMode = ref(true);

// デフォルトはcustomer、切り替え可能にする
const role = ref<"stylist" | "customer">("customer");

const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    alert("メールアドレスとパスワードを入力してください");
    return;
  }

  loading.value = true;
  const auth = getAuth();
  const db = getFirestore();

  try {
    // ログイン状態を維持する設定
    await setPersistence(auth, browserLocalPersistence);

    if (isLoginMode.value) {
      // --- ログイン処理 ---
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.value,
        password.value
      );

      if (!userCredential.user.emailVerified) {
        router.push("/verify-email");
      } else {
        router.push("/app");
      }
    } else {
      // --- 新規登録処理 ---
      if (!name.value) {
        alert("お名前を入力してください");
        loading.value = false;
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.value,
        password.value
      );
      const user = userCredential.user;

      // Firestoreに保存（選択されたroleを使用）
      await setDoc(doc(db, "users", user.uid), {
        name: name.value,
        role: role.value, // ★ここを修正（選択した役割が入る）
        email: email.value,
        createdAt: new Date(),
      });

      try {
        await sendEmailVerification(user);
        router.push("/verify-email");
      } catch (mailError) {
        console.error("メール送信エラー:", mailError);
        alert(
          "アカウントは作成されましたが、認証メールの送信に失敗しました。ログインして再試行してください。"
        );
        router.push("/login");
      }
    }
  } catch (e: any) {
    console.error(e);
    let message = "エラーが発生しました";
    if (e.code === "auth/invalid-email")
      message = "メールアドレスの形式が正しくありません";
    if (
      e.code === "auth/user-not-found" ||
      e.code === "auth/invalid-credential"
    )
      message = "メールアドレスまたはパスワードが間違っています";
    if (e.code === "auth/wrong-password")
      message = "パスワードが間違っています";
    if (e.code === "auth/email-already-in-use")
      message = "このメールアドレスは既に使用されています";
    if (e.code === "auth/weak-password")
      message = "パスワードは6文字以上で設定してください";
    alert(message);
  } finally {
    loading.value = false;
  }
};

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
};
</script>

<template>
  <div
    class="min-h-[100dvh] w-full bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 flex items-center justify-center p-6 relative overflow-hidden"
  >
    <div
      class="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] bg-white opacity-10 rounded-full blur-3xl animate-pulse"
    ></div>
    <div
      class="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-teal-300 opacity-20 rounded-full blur-3xl"
    ></div>

    <div
      class="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-500"
    >
      <div class="text-center mb-8">
        <h1
          class="text-4xl font-extrabold text-white tracking-tighter drop-shadow-sm mb-2"
        >
          HairLink
        </h1>
        <p class="text-white/80 text-sm font-medium tracking-wider">
          {{ isLoginMode ? "Welcome Back!" : "Create Account" }}
        </p>
      </div>

      <div class="space-y-5">
        <div v-if="!isLoginMode" class="animate-fadeIn">
          <label
            class="text-xs font-bold text-white/90 ml-1 tracking-wider uppercase block mb-1"
            >Role</label
          >
          <div class="flex gap-2 bg-black/20 p-1 rounded-2xl">
            <button
              type="button"
              @click="role = 'customer'"
              class="flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              :class="
                role === 'customer'
                  ? 'bg-white text-teal-600 shadow-md'
                  : 'text-white/60 hover:bg-white/10'
              "
            >
              <span>💇‍♀️</span> お客として利用
            </button>
            <button
              type="button"
              @click="role = 'stylist'"
              class="flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              :class="
                role === 'stylist'
                  ? 'bg-white text-teal-600 shadow-md'
                  : 'text-white/60 hover:bg-white/10'
              "
            >
              <span>✂️</span> 美容師として利用
            </button>
          </div>
        </div>

        <div v-if="!isLoginMode" class="space-y-1 animate-fadeIn">
          <label
            class="text-xs font-bold text-white/90 ml-1 tracking-wider uppercase"
            >Name</label
          >
          <input
            v-model="name"
            type="text"
            placeholder="お名前"
            class="w-full bg-white/80 border border-white/50 rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-teal-300/50 transition text-stone-700 font-bold placeholder-stone-400"
          />
        </div>

        <div class="space-y-1">
          <label
            class="text-xs font-bold text-white/90 ml-1 tracking-wider uppercase"
            >Email</label
          >
          <input
            v-model="email"
            type="email"
            placeholder="email@example.com"
            class="w-full bg-white/80 border border-white/50 rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-teal-300/50 transition text-stone-700 font-bold placeholder-stone-400"
          />
        </div>

        <div class="space-y-1">
          <label
            class="text-xs font-bold text-white/90 ml-1 tracking-wider uppercase"
            >Password</label
          >
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full bg-white/80 border border-white/50 rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-teal-300/50 transition text-stone-700 font-bold placeholder-stone-400"
          />
        </div>

        <button
          @click="handleSubmit"
          :disabled="loading"
          class="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-500/30 hover:shadow-teal-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
        >
          <span
            v-if="loading"
            class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></span>
          <span v-else>{{ isLoginMode ? "LOGIN" : "SIGN UP" }}</span>
        </button>

        <div class="text-center mt-4">
          <button
            @click="toggleMode"
            class="text-xs font-bold text-white/80 hover:text-white underline decoration-white/50 hover:decoration-white transition"
          >
            {{
              isLoginMode
                ? "アカウントをお持ちでない方はこちら (新規登録)"
                : "すでにアカウントをお持ちの方はこちら (ログイン)"
            }}
          </button>
        </div>
      </div>

      <div class="mt-8 text-center">
        <p class="text-[10px] text-white/50 font-medium">
          © 2025 HairLink Inc.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
</style>
