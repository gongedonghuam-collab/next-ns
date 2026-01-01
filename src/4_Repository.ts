function getShopConfig(botId) {
  const ss = SpreadsheetApp.openById(MASTER_DB_ID);
  const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    // A列(0)がBotID
    if (data[i][0] === botId) {
      return {
        botId: data[i][0],
        accessToken: data[i][1],
        bookingSheetId: data[i][2],
        notifyToken: data[i][3],
      };
    }
  }
  return null;
}

function deleteUserSession(sessionKey) {
  const p = PropertiesService.getUserProperties();
  p.deleteProperty(sessionKey + "_state");
  p.deleteProperty(sessionKey + "_date");
  p.deleteProperty(sessionKey + "_time");
}

function saveBooking(sheetId, userId, date, time, name) {
  const ss = SpreadsheetApp.openById(sheetId);
  let sheet = ss.getSheetByName("予約一覧");
  if (!sheet) {
    sheet = ss.insertSheet("予約一覧");
    sheet.appendRow(["日時", "UID", "日付", "時間", "名前"]);
  }
  sheet.appendRow([new Date(), userId, date, time, name]);
}
