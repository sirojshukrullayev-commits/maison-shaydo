// Admin uchun Supabase mijozi va fayl yuklash yordamchilari
import { SUPABASE_URL, SUPABASE_KEY, STORAGE_BUCKET, CDN } from '../config.js';

let client = null;

export async function getClient() {
  if (client) return client;
  const mod = await import(CDN.supabase);
  client = mod.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ms-admin-auth' },
  });
  return client;
}

export function errMsg(e) {
  if (!e) return 'Noma’lum xato';
  const m = e.message || String(e);
  if (/Invalid login credentials/i.test(m)) return 'E-pochta yoki parol noto‘g‘ri';
  if (/row-level security|permission denied|not authorized/i.test(m)) return 'Ruxsat yo‘q: bu amal faqat admin uchun';
  if (/duplicate key/i.test(m)) return 'Bunday qiymat (masalan, slug) allaqachon mavjud';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Internet aloqasi yo‘q yoki server javob bermadi';
  if (/Payload too large|exceeded the maximum/i.test(m)) return 'Fayl hajmi juda katta (maksimal 25 MB)';
  return m;
}

// Jadval bilan ishlash
export async function q(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

function extFor(type, name = '') {
  const map = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'application/pdf': 'pdf' };
  if (map[type]) return map[type];
  const m = String(name).toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return m ? m[1] : 'bin';
}

// Faylni Storage'ga yuklab, ommaviy URL qaytaradi
export async function uploadFile(blob, folder = 'misc', name = '') {
  const sb = await getClient();
  const type = blob.type || 'application/octet-stream';
  const ext = extFor(type, name || blob.name);
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${folder}/${Date.now()}-${rand}.${ext}`;
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Storage'dagi faylni o'chirish (faqat o'zimizning bucket bo'lsa)
export async function removeFileByUrl(url) {
  try {
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const i = String(url || '').indexOf(marker);
    if (i < 0) return;
    const path = decodeURIComponent(url.slice(i + marker.length));
    const sb = await getClient();
    await sb.storage.from(STORAGE_BUCKET).remove([path]);
  } catch (e) { /* asosiy amalga xalaqit bermasin */ }
}

// Rasmni brauzerda kichraytirish (katta fotosuratlar uchun)
export async function downscaleImage(file, max = 2000, quality = 0.9) {
  if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  const img = await loadImage(URL.createObjectURL(file));
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale >= 1 && file.size < 2.5 * 1024 * 1024) return file;
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return await new Promise((res) => c.toBlob((b) => res(b || file), type, quality));
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!String(src).startsWith('blob:') && !String(src).startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Rasmni ochib bo‘lmadi'));
    img.src = src;
  });
}
