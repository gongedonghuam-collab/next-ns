function handleMessage(event, config) {
  const userId = event.source.userId;
  const userMessage = event.message.text.trim();
  const replyToken = event.replyToken;
  const sessionKey = userId + "_" + config.botId;

  try {
    const userProps = PropertiesService.getUserProperties();
    let state = userProps.getProperty(sessionKey + "_state");

    // キャンセル処理
    if (["キャンセル", "やめる"].includes(userMessage)) {
      deleteUserSession(sessionKey);
      replyText(replyToken, "予約を中止しました。", config.accessToken);
      return;
    }

    // 会話ステートマシン
    if (!state) {
      if (userMessage.includes("予約")) {
        userProps.setProperty(sessionKey + "_state", "WAITING_DATE");
        replyText(
          replyToken,
          "【予約】ですね。\n希望の「日付」を入力してください。\n(例: 12月20日)",
          config.accessToken
        );
      } else {
        replyText(
          replyToken,
          "予約をする場合は「予約」と送ってください。",
          config.accessToken
        );
      }
    } else if (state === "WAITING_DATE") {
      userProps.setProperty(sessionKey + "_date", userMessage);
      userProps.setProperty(sessionKey + "_state", "WAITING_TIME");
      replyText(
        replyToken,
        `日付: ${userMessage} ですね。\n次に希望の「時間」を入力してください。\n(例: 14:00)`,
        config.accessToken
      );
    } else if (state === "WAITING_TIME") {
      userProps.setProperty(sessionKey + "_time", userMessage);
      userProps.setProperty(sessionKey + "_state", "WAITING_NAME");
      replyText(
        replyToken,
        `時間: ${userMessage} ですね。\n最後にお名前をお願いします。`,
        config.accessToken
      );
    } else if (state === "WAITING_NAME") {
      const name = userMessage;
      const date = userProps.getProperty(sessionKey + "_date");
      const time = userProps.getProperty(sessionKey + "_time");

      saveBooking(config.bookingSheetId, userId, date, time, name);

      replyText(
        replyToken,
        `予約を受け付けました！\n日時: ${date} ${time}\nお名前: ${name}`,
        config.accessToken
      );

      if (config.notifyToken) {
        sendAdminNotification(
          `予約が入りました: ${name}様 (${date} ${time})`,
          config.notifyToken
        );
      }
      deleteUserSession(sessionKey);
    }
  } catch (e) {
    console.error(e);
    deleteUserSession(sessionKey);
  }
}
