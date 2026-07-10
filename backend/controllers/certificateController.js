const uuid = require('uuid');
const path = require('path');
const fs = require('fs');
const googleSheets = require('../services/googleSheets');
const googleDrive = require('../services/googleDrive');
const imageGenerator = require('../services/imageGenerator');
const config = require('../../config');

function fileToBase64(filePath) {
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  return `data:image/${mime};base64,${data.toString('base64')}`;
}

async function create(req, res) {
  try {
    const id = uuid.v4();
    const body = req.body;

    let photoUrl = '';

    if (req.file) {
      try {
        const uploadResult = await googleDrive.uploadPhoto(
          req.file.path,
          `certificate_${id}${path.extname(req.file.originalname)}`
        );
        photoUrl = uploadResult.directUrl;

        fs.unlink(req.file.path, () => {});
      } catch {
        photoUrl = fileToBase64(req.file.path);
        fs.unlink(req.file.path, () => {});
      }
    }

    const data = {
      id,
      baby_name: body.baby_name || '',
      birth_date: body.birth_date || '',
      birth_time: body.birth_time || '',
      weight: body.weight || '',
      height: body.height || '',
      hospital: body.hospital || '',
      doctor: body.doctor || '',
      mother: body.mother || '',
      father: body.father || '',
      sign: body.sign || '',
      photo: photoUrl,
      template: body.template || 'classic-gold',
    };

    try {
      await googleSheets.appendRow(data);
    } catch {
      console.log('Google Sheets not configured — skipping save.');
    }

    const formats = ['png', 'jpg', 'pdf'];
    const outputFiles = await imageGenerator.generateFromTemplate(data, data.template, formats);

    res.status(201).json({
      success: true,
      id,
      files: outputFiles,
      data,
    });
  } catch (err) {
    console.error('Error creating certificate:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function list(req, res) {
  try {
    const rows = await googleSheets.getAllRows();
    res.json({ success: true, data: rows });
  } catch {
    res.json({ success: true, data: [], message: 'Google Sheets not configured' });
  }
}

async function getById(req, res) {
  try {
    const row = await googleSheets.getRowById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: row });
  } catch {
    res.status(404).json({ success: false, error: 'Not found' });
  }
}

async function download(req, res) {
  try {
    const { id, format } = req.params;
    const outputPath = path.join(config.paths.output, `${id}.${format}`);

    if (!fs.existsSync(outputPath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const mimeTypes = { png: 'image/png', jpg: 'image/jpeg', pdf: 'application/pdf' };
    res.setHeader('Content-Type', mimeTypes[format] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.${format}"`);
    fs.createReadStream(outputPath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function preview(req, res) {
  try {
    const body = req.body;
    const templateName = body.template || 'classic-gold';
    const photo = body.photo || '';

    const data = {
      id: 'preview',
      baby_name: body.baby_name || '',
      birth_date: body.birth_date || '',
      birth_time: body.birth_time || '',
      weight: body.weight || '',
      height: body.height || '',
      hospital: body.hospital || '',
      doctor: body.doctor || '',
      mother: body.mother || '',
      father: body.father || '',
      sign: body.sign || '',
      photo: photo,
      template: templateName,
    };

    const templateConfig = imageGenerator.findTemplateConfig(templateName);
    const html = imageGenerator.buildHtml(templateConfig.template, data);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getTemplates(req, res) {
  try {
    const templates = await imageGenerator.listTemplates();
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { create, list, getById, download, preview, getTemplates };
