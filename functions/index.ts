import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Firebase Adminの初期化
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// リージョン等の設定
setGlobalOptions({
  region: "asia-northeast1",
  memory: "1GiB",
  maxInstances: 10,
});

// 現在、NextNsアプリではサーバーサイド(Cloud Functions)の処理は使用していないため
// 定義を空にしています。将来的に通知機能などを追加する場合はここに記述します。
