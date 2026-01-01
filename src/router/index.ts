import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

import LandingView from "../views/LandingView/LandingView.vue";
import HomeView from "../views/HomeView/HomeView.vue";
import LoginView from "../views/LoginView/LoginView.vue";
import LegalView from "../views/LegalView/LegalView.vue";
import TermsView from "../views/TermsView/TermsView.vue";
import VerifyEmailView from "../views/VerifyEmailView/VerifyEmailView.vue";
import BookingLandingView from "../views/BookingLandingView/BookingLandingView.vue";

const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "landing",
      component: LandingView,
      meta: { public: true }, // 公開ページ
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
      meta: { public: true },
    },
    {
      // 予約ページ（ここが重要！）
      path: "/book/:stylistId",
      name: "book",
      component: BookingLandingView,
      meta: { public: true }, // ログイン不要にする
    },
    {
      path: "/app",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true }, // 認証が必要
    },
    {
      path: "/legal",
      name: "legal",
      component: LegalView,
      meta: { public: true },
    },
    {
      path: "/terms",
      name: "terms",
      component: TermsView,
      meta: { public: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

const getCurrentUser = () => {
  return new Promise((resolve) => {
    const auth = getAuth();
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

router.beforeEach(async (to, from, next) => {
  const auth = getAuth();
  const currentUser = await getCurrentUser();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isPublic = to.matched.some((record) => record.meta.public);

  // 1. セッション期限切れチェック (ログイン済みユーザーのみ)
  if (currentUser) {
    const lastActive = localStorage.getItem("hairlink_last_active");
    const now = new Date().getTime();
    if (lastActive) {
      const diff = now - parseInt(lastActive, 10);
      if (diff > SESSION_TIMEOUT) {
        await signOut(auth);
        localStorage.removeItem("hairlink_last_active");
        next("/login");
        return;
      }
    }
    localStorage.setItem("hairlink_last_active", now.toString());
  }

  // 2. 予約ページなどの公開ページは誰でもアクセスOK
  if (isPublic) {
    // ただし、ログイン済みユーザーが LP や Login 画面に行こうとしたらアプリへ飛ばす
    if (currentUser && (to.path === "/" || to.path === "/login")) {
      next("/app");
      return;
    }
    next();
    return;
  }

  // 3. 認証が必要なページへのアクセス制御
  if (requiresAuth && !currentUser) {
    next("/login");
  } else {
    next();
  }
});

export default router;
