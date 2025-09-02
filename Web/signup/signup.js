// signup/signup.js
const API = 'http://localhost:3000';

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('msg');

  const form = e.currentTarget;
  const name = form.querySelector('input[name="name"]').value.trim();
  const email = form.querySelector('input[name="email"]').value.trim();
  const password = form.querySelector('input[name="password"]').value;
  const confirm = form.querySelector('input[name="confirm"]').value;

  msg.textContent = 'Đang xử lý...';
  msg.className = 'msg';

  try {
    const res = await fetch(`${API}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirm })
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      msg.textContent = data.message || 'Đăng ký thất bại.';
      msg.className = 'msg err';
      return;
    }

    msg.textContent = '✅ Đăng ký thành công. Đang chuyển trang đăng nhập...';
    msg.className = 'msg ok';
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 700);
  } catch (err) {
    msg.textContent = 'Không kết nối được server.';
    msg.className = 'msg err';
  }
});

// eye toggle (nếu cần cho cả 2 ô)
document.querySelectorAll('.field.password').forEach(wrap=>{
  const input = wrap.querySelector('input');
  const eye = wrap.querySelector('.eye');
  if (eye) {
    eye.addEventListener('click', ()=>{
      input.type = input.type === 'password' ? 'text' : 'password';
      eye.classList.toggle('active');
    });
  }
});
