import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import HomeView from "../views/HomeView/HomeView.vue";
import LoginView from "../views/LoginView/LoginView.vue";
import VerifyEmailView from "../views/VerifyEmailView/VerifyEmailView.vue";
// ★ 演習画面をインポート
import StudyView from "../views/StudyView/StudyView.vue";
import ReviewView from "../views/ReviewView/ReviewView.vue";

// 仮のコンポーネント。中身がないとエラーになるため、後ほどReviewView.vueを作成してください。
const Placeholder = {
  template: '<div class="p-10 text-center">復習画面を作成中です</div>',
};

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
    {
      path: "/verify-email",
      name: "verify-email",
      component: VerifyEmailView,
      meta: { requiresAuth: true },
    },
    // ★ 演習画面を組み込み
    {
      path: "/study",
      name: "study",
      component: StudyView,
      meta: { requiresAuth: true },
    },
    // ★ 復習画面（次はこれを作成します）
    {
      path: "/review",
      name: "review",
      component: ReviewView, // ★ Placeholder から ReviewView に変更
      meta: { requiresAuth: true },
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
    next("/login");
  } else if (
    currentUser &&
    !currentUser.emailVerified &&
    to.name !== "verify-email"
  ) {
    next("/verify-email");
  } else if (
    currentUser &&
    currentUser.emailVerified &&
    to.name === "verify-email"
  ) {
    next("/");
  } else if (to.path === "/login" && currentUser && currentUser.emailVerified) {
    next("/");
  } else {
    next();
  }
});

export default router;
