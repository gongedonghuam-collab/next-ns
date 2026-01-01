import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import HomeView from "../views/HomeView/HomeView.vue";
import LoginView from "../views/LoginView/LoginView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true }, // 認証が必要なページ
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { public: true }, // 誰でも見れるページ
    },
  ],
});

// 画面遷移のたびに実行される「門番」の処理
router.beforeEach(async (to, from, next) => {
  const auth = getAuth();

  // Firebaseの認証状態が確定するまで待つプロミス（リロード対策）
  const currentUser = await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !currentUser) {
    // 認証が必要なのにログインしていない → ログイン画面へ飛ばす
    next("/login");
  } else if (to.path === "/login" && currentUser) {
    // ログイン済みでログイン画面に来た → ホームへ飛ばす
    next("/");
  } else {
    // それ以外 → そのまま通す
    next();
  }
});

export default router;
