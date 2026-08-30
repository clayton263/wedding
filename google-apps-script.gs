/**
 * Paste this into the Apps Script editor of the Google Sheet you want
 * RSVPs saved to (Extensions -> Apps Script), then deploy it as a Web App.
 * Full steps are in README.txt.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Add header row automatically the first time the sheet is used
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Name", "Attending", "Dietary requirements", "Notes / allergies"]);
  }

  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.timestamp,
    data.name,
    data.attending,
    data.dietary,
    data.notes
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
