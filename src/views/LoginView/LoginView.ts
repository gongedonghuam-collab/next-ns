import { ref } from "vue";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence, // ★ここを変更 (Session -> Local)
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useRouter } from "vue-router"; // Routerを使うために追加

export default function useLoginView() {
  // 状態管理
  const isLoginMode = ref(true); // true: ログイン, false: 新規登録
  // ★役割の選択肢を削除し、デフォルトをcustomerに固定
  const role = ref<"stylist" | "customer">("customer");
  const name = ref("");
  const email = ref("");
  const password = ref("");
  const loading = ref(false);

  // setup内でrouterを取得する必要があるため、この関数をコンポーネント内で呼ぶ前提に変更
  const router = useRouter();

  // 処理実行
  const handleSubmit = async () => {
    if (!email.value || !password.value) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    loading.value = true;
    const auth = getAuth();
    const db = getFirestore();

    try {
      // ★ここを変更: browserLocalPersistence (永続化) にする
      await setPersistence(auth, browserLocalPersistence);

      if (isLoginMode.value) {
        // --- ログイン処理 ---
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.value,
          password.value
        );

        // ログイン成功後は自動的にルーターが画面遷移（App.vue等の監視により）
        // 明示的に遷移させる場合:
        if (!userCredential.user.emailVerified) {
          // router.push("/verify-email"); // コンポーネント側で制御しているのでここではAuth状態変更だけでOK
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

        // Firestoreにユーザー情報を保存
        await setDoc(doc(db, "users", user.uid), {
          name: name.value,
          role: "customer", // ★強制的に 'customer' で登録
          email: email.value,
          createdAt: new Date(),
        });

        // メール確認送信
        await sendEmailVerification(user);
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

  return {
    isLoginMode,
    role,
    name,
    email,
    password,
    loading,
    handleSubmit,
    toggleMode,
  };
}
