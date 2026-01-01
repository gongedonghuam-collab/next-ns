function replyText(replyToken, text, accessToken) {
  UrlFetchApp.fetch(
    "[https://api.line.me/v2/bot/message/reply](https://api.line.me/v2/bot/message/reply)",
    {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + accessToken },
      payload: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: "text", text: text }],
      }),
    }
  );
}

function sendAdminNotification(message, token) {
  UrlFetchApp.fetch(
    "[https://notify-api.line.me/api/notify](https://notify-api.line.me/api/notify)",
    {
      method: "post",
      headers: { Authorization: "Bearer " + token },
      payload: { message: message },
    }
  );
}
