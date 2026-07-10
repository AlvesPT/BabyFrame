const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const controller = require('../controllers/certificateController');
const config = require('../../config');

const storage = multer.diskStorage({
  destination: config.paths.uploads,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(null, extOk && mimeOk);
  },
});

const router = express.Router();

router.post('/', upload.single('photo'), controller.create);
router.get('/', controller.list);
router.get('/templates', controller.getTemplates);
router.get('/:id', controller.getById);
router.get('/:id/download/:format', controller.download);

module.exports = router;
