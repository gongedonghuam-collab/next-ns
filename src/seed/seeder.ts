import { db } from "@/firebase";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { SAMPLE_QUESTIONS } from "./questions";

export const seedQuestionsToFirestore = async () => {
  if (!confirm("⚠️ データベースに問題データを投入しますか？")) return;

  console.log("🔥 データ投入開始...");

  // Firestoreの書き込みバッチ（まとめて送る機能）を作成
  const batch = writeBatch(db);
  const colRef = collection(db, "questions");

  SAMPLE_QUESTIONS.forEach((q) => {
    // 新しいドキュメントIDを自動生成
    const newDocRef = doc(colRef);

    // IDを含めてデータをセット
    batch.set(newDocRef, {
      ...q,
      id: newDocRef.id, // IDをデータ内にも持たせておく
      createdAt: new Date(),
    });
  });

  try {
    await batch.commit();
    alert("✅ データ投入完了！Firestoreを確認してください。");
    console.log("✅ データ投入完了");
  } catch (e) {
    console.error("❌ エラー発生:", e);
    alert("エラーが発生しました。コンソールを確認してください。");
  }
};
