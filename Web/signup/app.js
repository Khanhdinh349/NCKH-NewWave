// app.js — Lưu user bằng File System Access API (không hash)
const DB_NAME='fs-handles-db', STORE='handles', DIR_KEY='signup_dir_handle', FILE='user.json';

document.addEventListener('DOMContentLoaded', () => {
  const form=document.getElementById('signup-form');
  const msg =document.getElementById('form-msg');
  const pwd =document.getElementById('password');
  const eye =document.getElementById('pwd-eye');

  // Toggle 👁️
  eye.onclick=()=>{const show=pwd.type==='password'; pwd.type=show?'text':'password'; eye.textContent=show?'🙈':'👁️';};

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name =(document.getElementById('name').value||'').trim();
    const email=(document.getElementById('email').value||'').trim().toLowerCase();
    const pass =(pwd.value||'').trim();

    if(!name||!email||!pass) return show(msg,'Vui lòng điền đủ thông tin.',false);
    if(!/^\S+@\S+\.\S+$/.test(email)) return show(msg,'Email không hợp lệ.',false);
    if(pass.length<6) return show(msg,'Mật khẩu tối thiểu 6 ký tự.',false);

    try{
      let users=await readUsers(); if(!Array.isArray(users)) users=[];
      if(users.some(u=>(u.email||'').toLowerCase()===email)) return show(msg,'Email đã tồn tại.',false);

      users.push({id:Date.now(),name,email,password:pass,createdAt:new Date().toISOString()});
      await writeUsers(users);

      show(msg,'✅ Đăng ký thành công! Đã lưu vào user.json.',true);
      // Redirect ĐÚNG vì login.html cùng thư mục với signup.html
      setTimeout(()=>window.location.href='./login.html',900);
    }catch(err){
      console.error(err);
      show(msg,'Không thể ghi file. Hãy mở qua http://localhost (hoặc https) và chọn thư mục lưu.',false);
      // cho phép chọn lại lần sau
      await idbSet(DIR_KEY,null);
    }
  });
});

/* ===== File System Access ===== */
function fsOK(){return 'showDirectoryPicker'in window;}
async function ensureDir(){
  if(!fsOK()) throw new Error('Trình duyệt không hỗ trợ File System Access API.');
  let dir=await idbGet(DIR_KEY);
  if(dir && await perm(dir,true)) return dir;
  dir=await window.showDirectoryPicker({mode:'readwrite'});
  if(!await perm(dir,true)) throw new Error('Bạn đã từ chối quyền ghi.');
  await idbSet(DIR_KEY,dir); return dir;
}
async function perm(handle,write=false){
  const mode=write?'readwrite':'read';
  const q=await handle.queryPermission({mode}); if(q==='granted') return true;
  return (await handle.requestPermission({mode}))==='granted';
}
async function userFile(){
  const dir=await ensureDir();
  try{ return await dir.getFileHandle(FILE,{create:false}); }
  catch{
    const fh=await dir.getFileHandle(FILE,{create:true});
    const w=await fh.createWritable(); await w.write('[]'); await w.close(); return fh;
  }
}
async function readUsers(){
  const fh=await userFile(); const f=await fh.getFile(); const txt=await f.text();
  try{ return JSON.parse(txt||'[]'); }catch{return [];}
}
async function writeUsers(users){
  const fh=await userFile(); const w=await fh.createWritable();
  await w.write(JSON.stringify(users,null,2)); await w.close();
}

/* ===== IndexedDB (lưu folder handle) ===== */
async function idbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function idbGet(k){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const rq=tx.objectStore(STORE).get(k);rq.onsuccess=()=>res(rq.result||null);rq.onerror=()=>rej(rq.error);});}
async function idbSet(k,v){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');const rq=tx.objectStore(STORE).put(v,k);rq.onsuccess=()=>res(true);rq.onerror=()=>rej(rq.error);});}

/* ===== UI helper ===== */
function show(el,text,ok){el.textContent=text;el.style.color=ok?'#22c55e':'#ef4444';}
