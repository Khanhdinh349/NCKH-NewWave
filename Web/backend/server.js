// backend/server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'user.json');

async function ensureDataFile() {
  await fs.ensureDir(DATA_DIR);
  const exists = await fs.pathExists(DATA_FILE);
  if (!exists) await fs.writeJson(DATA_FILE, []);
}
async function readUsers() {
  await ensureDataFile();
  return fs.readJson(DATA_FILE);
}
async function writeUsers(users) {
  await fs.writeJson(DATA_FILE, users, { spaces: 2 });
}

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, confirm } = req.body || {};
    if (!name || !email || !password || !confirm) {
      return res.status(400).json({ ok: false, message: 'Thiếu thông tin.' });
    }
    if (password !== confirm) {
      return res.status(400).json({ ok: false, message: 'Mật khẩu nhập lại không khớp.' });
    }

    const users = await readUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ ok: false, message: 'Email đã được sử dụng.' });
    }

    const hash = await bcrypt.hash(password, 10);
    users.push({
      id: uuidv4(),
      name,
      email,
      password_hash: hash,
      created_at: new Date().toISOString()
    });
    await writeUsers(users);

    res.json({ ok: true, message: 'Đăng ký thành công.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Lỗi máy chủ.' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Thiếu thông tin.' });
    }

    const users = await readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ ok: false, message: 'Email chưa đăng ký.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ ok: false, message: 'Mật khẩu không đúng.' });

    res.json({
      ok: true,
      message: 'Đăng nhập thành công.',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Lỗi máy chủ.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend chạy tại http://localhost:${PORT}`));
