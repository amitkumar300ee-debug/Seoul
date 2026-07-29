// ===== Admin panel logic =====

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginBtn = document.getElementById('loginBtn');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');

function adminKey() { return sessionStorage.getItem('sw_admin_key') || ''; }

async function adminFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'X-Admin-Key': adminKey(), ...(opts.headers || {}) },
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

async function tryLogin() {
  const password = loginPassword.value;
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Checking…';
  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Wrong password');
    sessionStorage.setItem('sw_admin_key', password);
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';
    loadWallpapers();
  } catch (e) {
    loginError.textContent = e.message;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

loginBtn.addEventListener('click', tryLogin);
loginPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });

// If we already have a key from this session, skip straight to the dashboard.
if (adminKey()) {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'block';
}

// ---------- Upload form ----------
const dropZone = document.getElementById('dropZone');
const dropZoneEmpty = document.getElementById('dropZoneEmpty');
const fileInput = document.getElementById('fileInput');
const previewImg = document.getElementById('previewImg');
const titleInput = document.getElementById('titleInput');
const categoryInput = document.getElementById('categoryInput');
const isAiInput = document.getElementById('isAiInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');

let selectedFile = null;

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag');
  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });

function setFile(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    previewImg.src = reader.result;
    previewImg.style.display = 'block';
    dropZoneEmpty.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

uploadBtn.addEventListener('click', async () => {
  const title = titleInput.value.trim();
  const category = categoryInput.value.trim();
  if (!selectedFile) { uploadStatus.textContent = 'Choose an image first.'; return; }
  if (!title || !category) { uploadStatus.textContent = 'Title and category are required.'; return; }

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading…';
  uploadStatus.textContent = '';

  const form = new FormData();
  form.append('file', selectedFile);
  form.append('title', title);
  form.append('category', category);
  form.append('is_ai', isAiInput.checked ? 'true' : 'false');

  try {
    await adminFetch('/api/admin/upload', { method: 'POST', body: form });
    showToast('Wallpaper uploaded ✅');
    // reset form
    selectedFile = null;
    fileInput.value = '';
    previewImg.style.display = 'none';
    dropZoneEmpty.style.display = 'block';
    titleInput.value = '';
    categoryInput.value = '';
    isAiInput.checked = false;
    loadWallpapers();
  } catch (e) {
    uploadStatus.textContent = e.message;
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload Wallpaper';
  }
});

// ---------- Wallpaper list + delete ----------
const adminGrid = document.getElementById('adminGrid');
const countLabel = document.getElementById('countLabel');
const categoryList = document.getElementById('categoryList');

async function loadWallpapers() {
  try {
    const { walls } = await adminFetch('/api/admin/walls');
    countLabel.textContent = `${walls.length} total`;

    const cats = [...new Set(walls.map((w) => w.category))];
    categoryList.innerHTML = cats.map((c) => `<option value="${escapeHTML(c)}">`).join('');

    if (!walls.length) {
      adminGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>🖼️</span>No wallpapers uploaded yet.</div>`;
      return;
    }
    adminGrid.innerHTML = walls.map(adminCardHTML).join('');
    adminGrid.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.dataset.delete;
        if (!confirm('Delete this wallpaper? This cannot be undone.')) return;
        try {
          await adminFetch(`/api/admin/walls/${id}`, { method: 'DELETE' });
          showToast('Deleted');
          loadWallpapers();
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  } catch (e) {
    adminGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>⚠️</span>${escapeHTML(e.message)}</div>`;
  }
}

function adminCardHTML(w) {
  return `
    <div class="wall-card admin-card">
      <img src="${w.thumb_url || w.image_url}" alt="${escapeHTML(w.title)}" loading="lazy" />
      <div class="overlay"><span>${escapeHTML(w.title)}</span></div>
      <button class="admin-delete" data-delete="${w.id}" title="Delete">✕</button>
    </div>`;
}
