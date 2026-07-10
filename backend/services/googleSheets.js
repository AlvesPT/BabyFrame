const { google } = require('googleapis');
const config = require('../../config');

let sheetsClient = null;

function getClient() {
  if (sheetsClient) return sheetsClient;

  if (!config.google.serviceAccountEmail || !config.google.privateKey) {
    throw new Error('Google Sheets: credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env');
  }

  const auth = new google.auth.JWT(
    config.google.serviceAccountEmail,
    null,
    config.google.privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function appendRow(data) {
  const sheets = getClient();
  const values = [[
    data.id,
    data.baby_name,
    data.birth_date,
    data.birth_time,
    data.weight,
    data.height,
    data.hospital,
    data.doctor,
    data.mother,
    data.father,
    data.sign,
    data.photo,
    data.template,
    new Date().toISOString(),
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.google.sheetId,
    range: 'Certificados!A:N',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

async function getAllRows() {
  const sheets = getClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.sheetId,
    range: 'Certificados!A:N',
  });
  return response.data.values || [];
}

async function getRowById(id) {
  const rows = await getAllRows();
  const headers = rows[0];
  const row = rows.slice(1).find(r => r[0] === id);
  if (!row) return null;

  const obj = {};
  headers.forEach((h, i) => { obj[h.toLowerCase()] = row[i]; });
  return obj;
}

module.exports = { appendRow, getAllRows, getRowById };
