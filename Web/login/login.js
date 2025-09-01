// login.js
const FILE = 'user.json';
const DIR_KEY = 'signup_dir_handle'; // dùng chung với app.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const msg  = document.getElementById('login-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const pass  = document.getElementById('password').value;

    try {
      const users = await readUsersFromFolder();
      const hash  = await sha256(pass);

      // tìm người dùng theo email
      const u = users.find(x => x.email?.toLowerCase() === email);

      if (!u) return show(msg, 'Email hoặc mật khẩu không đúng.', false);

      // 1) Có passwordHash -> so sánh hash
      if (u.passwordHash) {
        if (u.passwordHash === hash) return success(u, users, msg);
        return show(msg, 'Email hoặc mật khẩu không đúng.', false);
      }

      // 2) Chỉ có password (plaintext) -> so sánh trực tiếp, rồi migrate sang hash
      if (u.password) {
        if (u.password === pass) {
          // migrate: thay password -> passwordHash
          delete u.password;
          u.passwordHash = hash;
          await writeUsersToFolder(users);
          return success(u, users, msg, '(đã nâng cấp bảo mật mật khẩu)');
        }
        return show(msg, 'Email hoặc mật khẩu không đúng.', false);
      }

      // 3) Không có cả 2
      show(msg, 'Tài khoản thiếu thông tin mật khẩu.', false);
    } catch (err) {
      console.error(err);
      show(msg, 'Không đọc được user.json. Hãy chọn đúng folder & chạy qua HTTPS/localhost.', false);
    }
  });
});

// ======= helpers (File System Access API + IndexedDB, giống app.js) =======
async function ensureDirHandle() {
  let dir = await idbGet('signup_dir_handle');
  if (dir && await verifyPerm(dir)) return dir;
  dir = await window.showDirectoryPicker({ mode: 'readwrite' });
  if (!await verifyPerm(dir)) throw new Error('No permission');
  await idbSet('signup_dir_handle', dir);
  return dir;
}
async function verifyPerm(handle, write=false) {
  const mode = write ? 'readwrite' : 'read';
  const q = await handle.queryPermission({ mode });
  if (q === 'granted') return true;
  const r = await handle.requestPermission({ mode });
  return r === 'granted';
}
async function getUserFileHandle() {
  const dir = await ensureDirHandle();
  return await dir.getFileHandle(FILE, { create: false });
}
async function readUsersFromFolder() {
  const fh = await getUserFileHandle();
  const f = await fh.getFile();
  return JSON.parse(await f.text() || '[]');
}
async function writeUsersToFolder(users) {
  const dir = await ensureDirHandle();
  const fh = await dir.getFileHandle(FILE, { create: true });
  const w = await fh.createWritable();
  await w.write(JSON.stringify(users, null, 2));
  await w.close();
}
async function idbOpen() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('fs-handles-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
    };
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction('handles', 'readonly');
    const st = tx.objectStore('handles');
    const rq = st.get(key);
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror   = () => rej(rq.error);
  });
}
async function idbSet(key, val) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction('handles', 'readwrite');
    const st = tx.objectStore('handles');
    const rq = st.put(val, key);
    rq.onsuccess = () => res(true);
    rq.onerror   = () => rej(rq.error);
  });
}
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function show(el, text, ok) {
  el.textContent = text;
  el.style.color = ok ? '#16a34a' : '#ef4444';
}
function success(u, users, msg, extra='') {
  show(msg, `Đăng nhập thành công! ${extra}`, true);
  setTimeout(() => {
    // chỉnh path đúng với cấu trúc thư mục của bạn
    window.location.href = '../homepage/homepage.html';
  }, 900);
}
