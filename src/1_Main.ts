function doPost(e) {
  try {
    const json = JSON.parse(e.postData.contents);

    // --- 【追加】ID確認用デバッグ機能 ---
    // Webhookが来たら、Bot IDをスプレッドシートのG1, G2セルに強制的に書き込む
    if (json.destination) {
      try {
        const ss = SpreadsheetApp.openById(MASTER_DB_ID);
        const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
        // G列に書き込み（A~D列のデータは消しません）
        sheet.getRange("G1").setValue("▼ 最新のBot ID (検証用) ▼");
        sheet.getRange("G2").setValue(json.destination);
      } catch (dbError) {
        // シートIDの設定ミスなどで書き込めない場合は無視
        console.error("Debug Write Error:", dbError);
      }
    }
    // ----------------------------------

    // Webhook検証用イベント(0000...)の場合は無視してOKを返す
    if (
      json.events &&
      json.events[0] &&
      json.events[0].replyToken === "00000000000000000000000000000000"
    ) {
      return ContentService.createTextOutput(
        JSON.stringify({ content: "verify ok" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const botId = json.destination; // どのBot宛か
    const shopConfig = getShopConfig(botId); // 設定を取得

    if (!shopConfig) {
      console.error("Unknown Bot ID:", botId);
      return ContentService.createTextOutput(
        JSON.stringify({ content: "error" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    json.events.forEach((event) => {
      if (event.type === "message" && event.message.type === "text") {
        handleMessage(event, shopConfig);
      }
    });
  } catch (error) {
    console.error("System Error:", error);
  }
  return ContentService.createTextOutput(
    JSON.stringify({ content: "post ok" })
  ).setMimeType(ContentService.MimeType.JSON);
}

// --- 【重要】権限承認用テスト関数 ---
// アップロード後、ブラウザのエディタでこの関数を一度だけ実行してください。
function testConnection() {
  console.log("権限の確認を行います...");
  try {
    const ss = SpreadsheetApp.openById(MASTER_DB_ID);
    console.log("成功！スプレッドシート名: " + ss.getName());
    console.log("権限は正常です。");
  } catch (e) {
    console.error("エラー発生:", e.message);
    console.error("ConfigファイルのスプレッドシートIDを確認してください。");
  }
}
