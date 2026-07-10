const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const config = require('../../config');

const ICONS_DIR = path.join(__dirname, '..', '..', 'assets', 'icons');

const COLOR_PALETTE = {
  primary: '#c9a84c',
  secondary: '#a8d5ff',
  accent: '#ffd966',
  text: '#2c1810',
  background: '#faf6f0',
};

function resolveColor(color, colors) {
  if (!color) return '#000';
  if (colors && colors[color]) return colors[color];
  if (COLOR_PALETTE[color]) return COLOR_PALETTE[color];
  return color;
}

function resolveFont(font, fonts) {
  if (!font) return 'Georgia, serif';
  if (fonts && fonts[font]) return fonts[font];
  return font;
}

function loadSvgIcon(iconName) {
  const iconPath = path.join(ICONS_DIR, `${iconName}.svg`);
  if (!fs.existsSync(iconPath)) return '';
  return fs.readFileSync(iconPath, 'utf-8');
}

function scaleVal(val, scaleX, scaleY) {
  return { x: Math.round(val.x * scaleX), y: Math.round(val.y * scaleY) };
}

function buildHtmlComponents(tpl, data) {
  const canvas = tpl.canvas || { width: tpl.size.width, height: tpl.size.height };
  const scaleX = tpl.size.width / canvas.width;
  const scaleY = tpl.size.height / canvas.height;
  const colors = tpl.colors || {};
  const fonts = tpl.fonts || {};

  const bgStyle = tpl.background
    ? `background-image: url('${tpl.background}'); background-size: cover;`
    : `background: ${tpl.backgroundColor || '#ffffff'};`;

  let elements = '';

  (tpl.components || []).forEach((comp) => {
    const box = scaleVal(comp, scaleX, scaleY);
    const type = comp.type;

    if (type === 'baby_photo' && data.photo) {
      elements += `<img src="${data.photo}" style="
        position: absolute;
        left: ${box.x}px; top: ${box.y}px;
        width: ${box.width}px; height: ${box.height}px;
        object-fit: cover;
        border-radius: ${comp.borderRadius || 0}px;
        border: ${comp.borderWidth || 3}px ${comp.borderStyle || 'solid'} ${comp.borderColor || '#fff'};
      " />`;
    }

    if (type === 'baby_name' && data.baby_name) {
      elements += `<div style="
        position: absolute;
        left: ${box.x}px; top: ${box.y}px;
        width: ${box.width}px; height: ${box.height}px;
        font-family: '${resolveFont(comp.fontFamily, fonts)}';
        font-size: ${Math.round(comp.fontSize * scaleX)}px;
        color: ${resolveColor(comp.color, colors)};
        text-align: ${comp.textAlign || 'left'};
        display: flex; align-items: center; justify-content: ${comp.textAlign === 'center' ? 'center' : comp.textAlign === 'right' ? 'flex-end' : 'flex-start'};
      ">${data.baby_name}</div>`;
    }

    if (type === 'title') {
      const titleText = comp.text || 'Certidão de Nascimento';
      elements += `<div style="
        position: absolute;
        left: ${box.x}px; top: ${box.y}px;
        width: ${box.width}px; height: ${box.height}px;
        font-family: '${resolveFont(comp.fontFamily, fonts)}';
        font-size: ${Math.round(comp.fontSize * scaleX)}px;
        color: ${resolveColor(comp.color, colors)};
        text-align: ${comp.textAlign || 'center'};
        display: flex; align-items: center; justify-content: ${comp.textAlign === 'center' ? 'center' : comp.textAlign === 'right' ? 'flex-end' : 'flex-start'};
      ">${titleText}</div>`;
    }

    if (type === 'data_card') {
      const iconSvg = comp.icon ? loadSvgIcon(comp.icon) : '';
      const value = data[comp.field] || '';
      const label = comp.label || '';

      let boxStyle = '';
      if (comp.boxStyle === 'dashed') {
        boxStyle = `border: 2px dashed ${resolveColor(colors.text || '#999', colors)}; border-radius: 12px;`;
      } else if (comp.boxStyle === 'rounded') {
        boxStyle = `border: 2px solid ${resolveColor(colors.secondary || '#ddd', colors)}; border-radius: 16px; background: rgba(255,255,255,0.5);`;
      } else {
        boxStyle = `border: 1px solid ${resolveColor(colors.secondary || '#ddd', colors)}; border-radius: 8px;`;
      }

      elements += `<div style="
        position: absolute;
        left: ${box.x}px; top: ${box.y}px;
        width: ${box.width}px; height: ${box.height}px;
        ${boxStyle}
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 8px;
        box-sizing: border-box;
      ">
        ${iconSvg ? `<div style="width: 40px; height: 40px; color: ${resolveColor(colors.primary || '#c9a84c', colors)};">${iconSvg}</div>` : ''}
        <div style="font-size: ${Math.round(12 * scaleX)}px; color: ${resolveColor(colors.secondary || '#999', colors)}; margin-top: 4px; font-family: '${resolveFont('body', fonts)}';">${label}</div>
        <div style="font-size: ${Math.round(comp.fontSize * scaleX || 36 * scaleX)}px; color: ${resolveColor(comp.color || colors.text, colors)}; font-family: '${resolveFont(comp.fontFamily || 'numbers', fonts)}'; font-weight: bold;">${value}</div>
      </div>`;
    }

    if (type === 'parents_box') {
      const mother = data.mother || '';
      const father = data.father || '';
      elements += `<div style="
        position: absolute;
        left: ${box.x}px; top: ${box.y}px;
        width: ${box.width}px; height: ${box.height}px;
        border-top: 2px solid ${resolveColor(colors.primary || '#c9a84c', colors)};
        display: flex; flex-direction: column; align-items: ${comp.textAlign === 'center' ? 'center' : 'flex-start'}; justify-content: center;
        padding: 10px;
        box-sizing: border-box;
      ">
        <div style="font-size: ${Math.round(comp.fontSize * scaleX)}px; color: ${resolveColor(comp.color, colors)}; font-family: '${resolveFont(comp.fontFamily, fonts)}';">${mother ? `Mãe: ${mother}` : ''}</div>
        <div style="font-size: ${Math.round(comp.fontSize * scaleX)}px; color: ${resolveColor(comp.color, colors)}; font-family: '${resolveFont(comp.fontFamily, fonts)}';">${father ? `Pai: ${father}` : ''}</div>
      </div>`;
    }

    if (type === 'hospital_badge') {
      const iconSvg = comp.icon ? loadSvgIcon(comp.icon) : '';
      const value = data[comp.field] || comp.label || '';

      elements += `<div style="
        position: absolute;
        left: ${box.x}px; top: ${box.y}px;
        width: ${box.width}px; height: ${box.height}px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
      ">
        ${iconSvg ? `<div style="width: 28px; height: 28px; color: ${resolveColor(colors.primary || '#c9a84c', colors)};">${iconSvg}</div>` : ''}
        <div style="font-size: ${Math.round(comp.fontSize * scaleX)}px; color: ${resolveColor(comp.color, colors)}; font-family: '${resolveFont(comp.fontFamily, fonts)}'; text-align: center;">${value}</div>
      </div>`;
    }

    if (type === 'doctor' && data.doctor) {
      elements += `<div style="
        position: absolute;
        left: ${box.x}px; top: ${box.y}px;
        width: ${box.width}px; height: ${box.height}px;
        font-size: ${Math.round(comp.fontSize * scaleX)}px;
        color: ${resolveColor(comp.color, colors)};
        font-family: '${resolveFont(comp.fontFamily, fonts)}';
        text-align: ${comp.textAlign || 'center'};
      ">Dr(a): ${data.doctor}</div>`;
    }
  });

  return `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display&family=Cormorant+Garamond&family=Cinzel&display=swap" rel="stylesheet">
  <style>
    @page { margin: 0; size: ${tpl.size.width}px ${tpl.size.height}px; }
    body {
      margin: 0;
      width: ${tpl.size.width}px;
      height: ${tpl.size.height}px;
      ${bgStyle}
      position: relative;
      overflow: hidden;
      font-family: Georgia, serif;
    }
  </style>
</head>
<body>
  ${elements}
</body>
</html>`;
}

function buildHtml(templateConfig, data) {
  const tpl = templateConfig;
  const fields = tpl.fields;

  if (tpl.components) {
    return buildHtmlComponents(tpl, data);
  }

  const photoStyle = `
    position: absolute;
    left: ${tpl.photo.x}px;
    top: ${tpl.photo.y}px;
    width: ${tpl.photo.width}px;
    height: ${tpl.photo.height}px;
    object-fit: cover;
    border-radius: ${tpl.photo.borderRadius || 0}px;
    border: ${tpl.photo.borderWidth || 3}px ${tpl.photo.borderStyle || 'solid'} ${tpl.photo.borderColor || '#fff'};
  `;

  let fieldStyles = '';
  Object.entries(fields || {}).forEach(([key, f]) => {
    const value = f.text || data[key] || '';
    if (!value) return;
    fieldStyles += `
      <div style="
        position: absolute;
        left: ${f.x}px;
        top: ${f.y}px;
        font-family: '${f.fontFamily || 'Georgia, serif'}';
        font-size: ${f.fontSize || 40}px;
        color: ${f.color || '#000'};
        text-align: ${f.textAlign || 'left'};
        white-space: nowrap;
      ">${value}</div>`;
  });

  const bgStyle = tpl.background
    ? `background-image: url('${tpl.background}'); background-size: cover;`
    : `background: ${tpl.backgroundColor || '#ffffff'};`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet">
      <style>
        @page { margin: 0; size: ${tpl.size.width}px ${tpl.size.height}px; }
        body { margin: 0; width: ${tpl.size.width}px; height: ${tpl.size.height}px; ${bgStyle} position: relative; overflow: hidden; }
      </style>
    </head>
    <body>
      <img src="${data.photo}" style="${photoStyle}" />
      ${fieldStyles}
    </body>
    </html>
  `;
}

async function generate(data, templateConfig, formats = ['png']) {
  const html = buildHtml(templateConfig, data);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: templateConfig.size.width,
    height: templateConfig.size.height,
    deviceScaleFactor: 2,
  });

  await page.setContent(html, { waitUntil: 'load' });

  const outputId = data.id || Date.now().toString();
  const outputFiles = {};

  for (const fmt of formats) {
    const ext = fmt === 'jpg' ? 'jpeg' : fmt;
    const outputPath = path.join(config.paths.output, `${outputId}.${fmt}`);

    if (fmt === 'pdf') {
      await page.pdf({
        path: outputPath,
        width: templateConfig.size.width,
        height: templateConfig.size.height,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    } else {
      await page.screenshot({
        path: outputPath,
        type: ext,
        fullPage: true,
      });
    }

    outputFiles[fmt] = outputPath;
  }

  await browser.close();
  return outputFiles;
}

function findTemplateConfig(templateName) {
  const searchPaths = [
    path.join(config.paths.templates, `${templateName}.json`),
    path.join(config.paths.templates, templateName, 'config.json'),
    path.join(config.paths.templates, 'baby', 'vertical', templateName, 'config.json'),
    path.join(config.paths.templates, 'baby', 'horizontal', templateName, 'config.json'),
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  }

  const folderName = templateName.replace('-', path.sep);
  const folderPath = path.join(config.paths.templates, folderName, 'config.json');
  if (fs.existsSync(folderPath)) {
    return JSON.parse(fs.readFileSync(folderPath, 'utf-8'));
  }

  throw new Error(`Template not found: ${templateName}`);
}

async function generateFromTemplate(data, templateName, formats) {
  const templateConfig = findTemplateConfig(templateName);
  return generate(data, templateConfig.template, formats);
}

async function listTemplates() {
  const results = [];

  function scan(dir, category) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        const configPath = path.join(full, 'config.json');
        if (fs.existsSync(configPath)) {
          const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          const tpl = cfg.template;
          results.push({
            name: tpl.name,
            id: tpl.id || item,
            category: tpl.category || category,
            layout: tpl.layout || 'vertical',
            orientation: tpl.orientation || 'portrait',
            size: tpl.size,
            thumbnail: tpl.thumbnail || null,
          });
        } else {
          scan(full, item);
        }
      }
    }
  }

  scan(config.paths.templates);

  const flatFiles = fs.readdirSync(config.paths.templates).filter(f => f.endsWith('.json'));
  for (const f of flatFiles) {
    const raw = JSON.parse(fs.readFileSync(path.join(config.paths.templates, f), 'utf-8'));
    if (raw.template && !results.find(r => r.id === raw.template.id || r.name === raw.template.name)) {
      results.push({
        name: raw.template.name,
        id: f.replace('.json', ''),
        category: 'geral',
        layout: raw.template.orientation === 'landscape' ? 'horizontal' : 'vertical',
        orientation: raw.template.orientation || 'landscape',
        size: raw.template.size,
        thumbnail: null,
      });
    }
  }

  return results;
}

module.exports = { generate, generateFromTemplate, buildHtml, listTemplates };
