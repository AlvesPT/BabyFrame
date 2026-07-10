const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const config = require('../../config');

function buildHtml(templateConfig, data) {
  const tpl = templateConfig;
  const fields = tpl.fields;

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
  Object.entries(fields).forEach(([key, f]) => {
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

async function generateFromTemplate(data, templateName, formats) {
  const templatePath = path.join(config.paths.templates, `${templateName}.json`);
  const templateConfig = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
  return generate(data, templateConfig.template, formats);
}

module.exports = { generate, generateFromTemplate, buildHtml };
