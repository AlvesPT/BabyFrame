const form = document.getElementById('certificateForm');
const photoInput = document.getElementById('photo');
const photoPreview = document.getElementById('photoPreview');
const previewImg = document.getElementById('previewImg');
const removePhotoBtn = document.getElementById('removePhoto');
const photoUpload = document.getElementById('photoUpload');
const submitBtn = document.getElementById('submitBtn');
const previewEmpty = document.getElementById('previewEmpty');
const previewFrameWrap = document.getElementById('previewFrameWrap');
const previewFrame = document.getElementById('previewFrame');
const resultCard = document.getElementById('resultCard');
const downloadButtons = document.getElementById('downloadButtons');
const templatePicker = document.getElementById('templatePicker');
const templateInput = document.getElementById('template');

let selectedFile = null;
let photoBase64 = '';
let templatesData = [];
let previewTimeout = null;

photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    photoBase64 = ev.target.result;
    previewImg.src = photoBase64;
    photoPreview.style.display = 'block';
    photoUpload.querySelector('.upload-placeholder').style.display = 'none';
    schedulePreview();
  };
  reader.readAsDataURL(file);
});

removePhotoBtn.addEventListener('click', () => {
  selectedFile = null;
  photoBase64 = '';
  photoInput.value = '';
  photoPreview.style.display = 'none';
  photoUpload.querySelector('.upload-placeholder').style.display = 'flex';
  previewFrameWrap.style.display = 'none';
  previewEmpty.style.display = 'block';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedFile) {
    alert('Por favor, selecione uma foto.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').style.display = 'none';
  submitBtn.querySelector('.btn-loading').style.display = 'inline';

  try {
    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('baby_name', document.getElementById('baby_name').value);
    formData.append('birth_date', document.getElementById('birth_date').value);
    formData.append('birth_time', document.getElementById('birth_time').value);
    formData.append('weight', document.getElementById('weight').value);
    formData.append('height', document.getElementById('height').value);
    formData.append('hospital', document.getElementById('hospital').value);
    formData.append('doctor', document.getElementById('doctor').value);
    formData.append('mother', document.getElementById('mother').value);
    formData.append('father', document.getElementById('father').value);
    formData.append('sign', document.getElementById('sign').value);
    formData.append('template', templateInput.value);

    const response = await fetch('/api/certificates', { method: 'POST', body: formData });
    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    downloadButtons.innerHTML = '';
    const formats = ['png', 'jpg', 'pdf'];
    formats.forEach(fmt => {
      const a = document.createElement('a');
      a.href = `/api/certificates/${result.id}/download/${fmt}`;
      a.className = 'btn-download';
      a.download = `${result.id}.${fmt}`;
      a.textContent = fmt.toUpperCase();
      downloadButtons.appendChild(a);
    });

    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Erro: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').style.display = 'inline';
    submitBtn.querySelector('.btn-loading').style.display = 'none';
  }
});

const formInputs = form.querySelectorAll('input, select');
formInputs.forEach(el => el.addEventListener('input', schedulePreview));
formInputs.forEach(el => el.addEventListener('change', schedulePreview));

function schedulePreview() {
  if (previewTimeout) clearTimeout(previewTimeout);
  previewTimeout = setTimeout(fetchPreview, 300);
}

function getFormData() {
  return {
    baby_name: document.getElementById('baby_name').value,
    birth_date: document.getElementById('birth_date').value,
    birth_time: document.getElementById('birth_time').value,
    weight: document.getElementById('weight').value,
    height: document.getElementById('height').value,
    hospital: document.getElementById('hospital').value,
    doctor: document.getElementById('doctor').value,
    mother: document.getElementById('mother').value,
    father: document.getElementById('father').value,
    sign: document.getElementById('sign').value,
    template: templateInput.value,
    photo: photoBase64,
  };
}

async function fetchPreview() {
  const data = getFormData();

  const hasContent = data.baby_name || data.birth_date || data.weight || data.photo;
  if (!hasContent) {
    previewFrameWrap.style.display = 'none';
    previewEmpty.style.display = 'block';
    return;
  }

  previewEmpty.style.display = 'none';
  previewFrameWrap.style.display = 'block';

  try {
    const response = await fetch('/api/certificates/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Preview failed');
    const html = await response.text();

    const selectedTpl = templatesData.find(t => t.id === templateInput.value);
    const tplW = selectedTpl ? selectedTpl.size.width : 3508;
    const tplH = selectedTpl ? selectedTpl.size.height : 2480;
    const containerW = previewFrameWrap.clientWidth || 400;

    const scale = containerW / tplW;
    const scaledH = Math.round(tplH * scale);

    previewFrame.style.width = tplW + 'px';
    previewFrame.style.height = tplH + 'px';
    previewFrame.style.transform = 'scale(' + scale + ')';
    previewFrameWrap.style.height = scaledH + 'px';

    previewFrame.srcdoc = html;
  } catch {
    previewFrameWrap.style.display = 'none';
    previewEmpty.style.display = 'block';
    previewEmpty.innerHTML = '<p>Erro ao gerar pré-visualização</p>';
  }
}

window.addEventListener('resize', () => {
  if (previewFrameWrap.style.display !== 'none') {
    scalePreviewFrame();
  }
});

async function loadTemplates() {
  try {
    const response = await fetch('/api/certificates/templates');
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    templatesData = result.data;
    renderTemplates(result.data);
  } catch (err) {
    templatePicker.innerHTML = '<div class="template-loading">Erro ao carregar templates</div>';
  }
}

function renderTemplates(templates) {
  const categories = {};
  templates.forEach(t => {
    const cat = t.category || 'geral';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(t);
  });

  let html = '';
  Object.entries(categories).forEach(([cat, tmpls]) => {
    html += `<div class="template-category-label">${cat}</div>`;
    html += '<div class="template-grid">';
    tmpls.forEach(t => {
      const active = t.id === templateInput.value ? ' active' : '';
      const orientation = t.orientation === 'portrait' ? 'Vertical' : 'Horizontal';
      const dims = t.size ? `${Math.round(t.size.width/100)}×${Math.round(t.size.height/100)} cm` : '';
      html += `
        <div class="template-card${active}" data-id="${t.id}">
          <div class="template-name">${t.name}</div>
          <div class="template-orientation">${orientation}</div>
          <div class="template-dimensions">${dims}</div>
        </div>
      `;
    });
    html += '</div>';
  });

  templatePicker.innerHTML = html;

  templatePicker.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      templatePicker.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      templateInput.value = card.dataset.id;
      schedulePreview();
    });
  });
}

loadTemplates();
