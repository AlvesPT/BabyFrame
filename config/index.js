require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  google: {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    sheetId: process.env.GOOGLE_SHEET_ID,
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
  paths: {
    uploads: path.join(__dirname, '..', 'uploads'),
    output: path.join(__dirname, '..', 'output'),
    templates: path.join(__dirname, '..', 'templates'),
    frontend: path.join(__dirname, '..', 'frontend'),
    public: path.join(__dirname, '..', 'public'),
  },
};
