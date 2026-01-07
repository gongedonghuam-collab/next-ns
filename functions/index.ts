import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2"; // ★追加
import * as admin from "firebase-admin";

// 旧コードの互換性のために残す（必要なら import * as functions from "firebase-functions"; に書き換えて使用）
// const functions = require("firebase-functions");

// ★追加: サーバーの場所を東京に設定
setGlobalOptions({ region: "asia-northeast1" });

admin.initializeApp();

/**
 * ★新機能: 模試が作成されたときに、全ユーザーへプッシュ通知を送信する関数
 */
export const notifyOnMockExamCreated = onDocumentCreated(
  "mock_exams/{examId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const examData = snapshot.data();
    const title = examData.title || "新しい模試";

    // 1. 送るメッセージの内容設定
    const message = {
      notification: {
        title: "📢 全国統一模試が公開されました！",
        body: `「${title}」の受付が開始されました。今すぐ実力をチェックしましょう！`,
      },
      webpush: {
        fcmOptions: {
          link: "/mock-exam", // 通知をタップしたら模試画面へ遷移
        },
      },
    };

    // 2. 全ユーザーのFCMトークンを取得
    const usersSnap = await admin.firestore().collection("users").get();
    let tokens: string[] = [];

    usersSnap.forEach((doc) => {
      const userData = doc.data();
      // fcmTokens配列を持っているユーザーのトークンを収集
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        tokens.push(...userData.fcmTokens);
      }
    });

    // 重複したトークンを削除
    tokens = [...new Set(tokens)];

    if (tokens.length === 0) {
      console.log("送信先トークンがありません。");
      return;
    }

    // 3. 一括送信 (最大500件ずつ)
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: message.notification,
        webpush: message.webpush,
      });

      console.log(
        `通知送信完了: 成功 ${response.successCount} 件 / 失敗 ${response.failureCount} 件`
      );
    } catch (error) {
      console.error("通知送信エラー:", error);
    }
  }
);

// ============================================================
//  以下、旧コード（Stripe決済機能など） ※念のためコメントアウトで保持
// ============================================================

// const stripe = require("stripe")(
//   "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"
// );

// // 1. 決済セッションを作成する関数（フロントから呼ばれる）
// exports.createCheckoutSession = functions.https.onCall(
//   async (data, context) => {
//     // ログインしていないと拒否
//     if (!context.auth) {
//       throw new functions.https.HttpsError(
//         "unauthenticated",
//         "User must be logged in"
//       );
//     }

//     const uid = context.auth.uid;
//     const userEmail = context.auth.token.email;

//     // Stripeで決済セッションを作成
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "subscription", // サブスクリプションモード
//       line_items: [
//         {
//           price: "price_1SlrgxCRUPdCre1Qlrcvt90g",
//           quantity: 1,
//         },
//       ],
//       customer_email: userEmail,
//       metadata: { uid: uid }, // 誰が買ったかわかるようにUIDを埋め込む
//       success_url: "http://localhost:5173/result?status=success", // 決済成功時の戻り先
//       cancel_url: "http://localhost:5173/premium", // キャンセル時の戻り先
//     });

//     return { url: session.url };
//   }
// );

// // 2. 決済完了を受け取るWebhook（Stripeから自動で呼ばれる）
// exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
//   const sig = req.headers["stripe-signature"];
//   const endpointSecret =
//     "Stripeダッシュボードで取得するWebhook署名シークレット";

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
//   } catch (err) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   // 決済完了イベントのみ処理
//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object;
//     const uid = session.metadata.uid;

//     // Firestoreのユーザー情報を更新してプレミアムにする
//     await admin.firestore().collection("users").doc(uid).update({
//       isPremium: true,
//       stripeCustomerId: session.customer,
//       subscriptionId: session.subscription,
//       updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//     });
//   }

//   res.json({ received: true });
// });
