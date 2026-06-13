/**
 * IL Esports Leaderboard — Google Apps Script backend
 *
 * SETUP STEPS (do this once):
 * 1. Go to https://script.google.com and click "New project"
 * 2. Paste this entire file into the editor (replace the default code)
 * 3. Click "Save" (floppy disk icon)
 * 4. Click "Deploy" → "New deployment"
 * 5. Select type: "Web app"
 * 6. Set "Execute as": Me (your Google account)
 * 7. Set "Who has access": Anyone
 * 8. Click "Deploy" → copy the Web app URL
 * 9. Paste that URL into index.html where it says: APPS_SCRIPT_URL = '...'
 * 10. Also create a Google Sheet, copy its ID from the URL, and paste below.
 *
 * Sheet URL looks like: https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
 */

var SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // <-- paste your Sheet ID here

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'name', 'email', 'score', 'level']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
}

/* ── POST: save a new score entry ── */
function doPost(e) {
  try {
    var data  = JSON.parse(e.postData.contents);
    var sheet = getSheet();
    ensureHeader(sheet);
    sheet.appendRow([
      new Date().toISOString(),
      data.name  || '',
      data.email || '',
      Number(data.score) || 0,
      Number(data.level) || 1
    ]);
    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

/* ── GET: return top 10 by score (email excluded) ── */
function doGet(e) {
  try {
    var sheet = getSheet();
    var rows  = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return jsonResponse([]);
    }
    // skip header row, build objects
    var entries = rows.slice(1).map(function(r) {
      return { ts: r[0], name: r[1], score: Number(r[3]), level: Number(r[4]) };
    });
    // sort by score desc, then level desc
    entries.sort(function(a, b) {
      return b.score - a.score || b.level - a.level;
    });
    return jsonResponse(entries.slice(0, 10));
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
