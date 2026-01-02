import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import HomeView from "../views/HomeView/HomeView.vue";
import LoginView from "../views/LoginView/LoginView.vue";
import VerifyEmailView from "../views/VerifyEmailView/VerifyEmailView.vue"; // ★新規作成予定

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { public: true },
    },
    // ★追加: メール確認待機画面
    {
      path: "/verify-email",
      name: "verify-email",
      component: VerifyEmailView,
      meta: { requiresAuth: true }, // ログインはしている状態なのでtrue
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const auth = getAuth();
  const currentUser = await new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !currentUser) {
    // 未ログインならログイン画面へ
    next("/login");
  } else if (
    currentUser &&
    !currentUser.emailVerified &&
    to.name !== "verify-email"
  ) {
    // ★追加: ログインしてるけど「メール未認証」なら待機画面へ強制移動
    next("/verify-email");
  } else if (
    currentUser &&
    currentUser.emailVerified &&
    to.name === "verify-email"
  ) {
    // ★追加: 認証済みなら待機画面には入れない（ホームへ）
    next("/");
  } else if (to.path === "/login" && currentUser && currentUser.emailVerified) {
    // ログイン済み＆認証済みならホームへ
    next("/");
  } else {
    next();
  }
});

export default router;
