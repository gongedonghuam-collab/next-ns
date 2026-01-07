const functions = require("firebase-functions");
const admin = require("firebase-admin");
// const stripe = require("stripe")(
//   "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"
// );
admin.initializeApp();
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
