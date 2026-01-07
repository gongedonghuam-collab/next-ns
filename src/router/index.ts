import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import HomeView from "../views/HomeView/HomeView.vue";
import LoginView from "../views/LoginView/LoginView.vue";
import VerifyEmailView from "../views/VerifyEmailView/VerifyEmailView.vue";
import StudyView from "../views/StudyView/StudyView.vue";
import ReviewView from "../views/ReviewView/ReviewView.vue"; // ★ 復活
import ResultView from "../views/ResultView/ResultView.vue";
import AdminView from "../views/AdminView/AdminView.vue";
import QuestionDetailView from "../views/QuestionDetailView/QuestionDetailView.vue";
import MockExamView from "../views/MockExamView/MockExamView.vue";

// ★ここにあなたのUIDを設定してください
const ADMIN_UIDS = ["SyfPBfS5D3VMktj2cEzXCxI1dbv1"];

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
    {
      path: "/study",
      name: "study",
      component: StudyView,
      meta: { requiresAuth: true },
    },
    // ★★★ 復活: 復習モードへのルート ★★★
    {
      path: "/review",
      name: "review",
      component: ReviewView,
      meta: { requiresAuth: true },
    },
    // ★★★★★★★★★★★★★★★★★★★★★
    {
      path: "/mock-exam",
      name: "mock-exam",
      component: MockExamView,
      meta: { requiresAuth: true },
    },
    {
      path: "/result",
      name: "result",
      component: ResultView,
      meta: { requiresAuth: true },
    },
    {
      path: "/admin",
      name: "admin",
      component: AdminView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/question/:id",
      name: "question-detail",
      component: QuestionDetailView,
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
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);

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
  } else if (
    requiresAdmin &&
    currentUser &&
    !ADMIN_UIDS.includes(currentUser.uid)
  ) {
    alert("⛔️ アクセス権限がありません");
    next("/");
  } else {
    next();
  }
});

export default router;
