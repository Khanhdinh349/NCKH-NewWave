// login/login.js
const API = 'http://localhost:3000';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('login-msg');

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  msg.textContent = 'Đang kiểm tra...';

  try {
    const res = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      msg.textContent = data.message || 'Đăng nhập thất bại.';
      msg.style.color = '#e57373';
      return;
    }

    // lưu session (tùy chọn)
    sessionStorage.setItem('currentUser', JSON.stringify(data.user));
    msg.textContent = '✅ Đăng nhập thành công. Đang chuyển trang...';
    msg.style.color = '#2e7d32';

    setTimeout(() => {
      // Trang homepage của bạn đang là homepage.html (đã có trong dự án)
      window.location.href = '/homepage/homepage.html';
    }, 600);
  } catch (err) {
    msg.textContent = 'Không kết nối được server.';
    msg.style.color = '#e57373';
  }
});
