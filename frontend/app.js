const form = document.getElementById('certificateForm');
const photoInput = document.getElementById('photo');
const photoPreview = document.getElementById('photoPreview');
const previewImg = document.getElementById('previewImg');
const removePhotoBtn = document.getElementById('removePhoto');
const photoUpload = document.getElementById('photoUpload');
const submitBtn = document.getElementById('submitBtn');
const previewEmpty = document.getElementById('previewEmpty');
const previewContent = document.getElementById('previewContent');
const resultCard = document.getElementById('resultCard');
const downloadButtons = document.getElementById('downloadButtons');
const templatePicker = document.getElementById('templatePicker');
const templateInput = document.getElementById('template');

let selectedFile = null;
let templatesData = [];

photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    previewImg.src = ev.target.result;
    photoPreview.style.display = 'block';
    photoUpload.querySelector('.upload-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
  updatePreview();
});

removePhotoBtn.addEventListener('click', () => {
  selectedFile = null;
  photoInput.value = '';
  photoPreview.style.display = 'none';
  photoUpload.querySelector('.upload-placeholder').style.display = 'flex';
  previewContent.style.display = 'none';
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
formInputs.forEach(el => el.addEventListener('input', updatePreview));
formInputs.forEach(el => el.addEventListener('change', updatePreview));

function updatePreview() {
  const hasAnyField = Array.from(formInputs).some(i => i.value);
  if (!hasAnyField && !selectedFile) {
    previewEmpty.style.display = 'block';
    previewContent.style.display = 'none';
    return;
  }

  previewEmpty.style.display = 'none';
  previewContent.style.display = 'block';

  const selectedTpl = templatesData.find(t => t.id === templateInput.value);
  const isLandscape = selectedTpl && selectedTpl.orientation === 'landscape';
  const bgColor = '#faf6f0';

  previewContent.innerHTML = `
    <div style="background:${bgColor}; border-radius:8px; padding:20px; font-family:Georgia,serif; ${isLandscape ? 'max-width:100%;' : ''}">
      <div style="display:flex; gap:15px; ${isLandscape ? 'flex-direction:column;' : ''}">
        <div style="width:${isLandscape ? '100%' : '120px'}; height:${isLandscape ? '120px' : '160px'}; background:#e8ddd0; border-radius:8px; overflow:hidden; flex-shrink:0;">
          ${selectedFile ? `<img src="${previewImg.src}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="padding:60px 20px;text-align:center;color:#a09080;">Foto</div>'}
        </div>
        <div style="flex:1;">
          <div style="font-family:'Great Vibes',cursive;font-size:1.5rem;color:#c9a84c;">Certidão de Nascimento</div>
          <div style="font-size:1.2rem;margin-top:8px;"><strong>${document.getElementById('baby_name').value || 'Nome do Bebé'}</strong></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:10px;font-size:0.85rem;">
            <span>Data: ${document.getElementById('birth_date').value || '—'}</span>
            <span>Hora: ${document.getElementById('birth_time').value || '—'}</span>
            <span>Peso: ${document.getElementById('weight').value || '—'}</span>
            <span>Altura: ${document.getElementById('height').value || '—'}</span>
          </div>
          <div style="margin-top:8px;font-size:0.85rem;">
            <div>${document.getElementById('hospital').value || 'Hospital'}</div>
            <div>Dr(a): ${document.getElementById('doctor').value || '—'}</div>
          </div>
          <div style="margin-top:8px;font-size:0.85rem;border-top:1px solid #e8ddd0;padding-top:8px;">
            <div>Mãe: ${document.getElementById('mother').value || '—'}</div>
            <div>Pai: ${document.getElementById('father').value || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

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
      updatePreview();
    });
  });
}

loadTemplates();
