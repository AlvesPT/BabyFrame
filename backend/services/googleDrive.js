const { google } = require('googleapis');
const fs = require('fs');
const config = require('../../config');

let driveClient = null;

function getClient() {
  if (driveClient) return driveClient;

  if (!config.google.serviceAccountEmail || !config.google.privateKey) {
    throw new Error('Google Drive: credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env');
  }

  const auth = new google.auth.JWT(
    config.google.serviceAccountEmail,
    null,
    config.google.privateKey,
    ['https://www.googleapis.com/auth/drive.file']
  );

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

async function uploadPhoto(filePath, fileName) {
  const drive = getClient();
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: config.google.driveFolderId ? [config.google.driveFolderId] : [],
    },
    media: {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(filePath),
    },
    fields: 'id, webViewLink',
  });

  const fileId = response.data.id;

  await drive.permissions.create({
    fileId: fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    id: fileId,
    url: response.data.webViewLink,
    directUrl: `https://drive.google.com/uc?id=${fileId}`,
  };
}

module.exports = { uploadPhoto };
