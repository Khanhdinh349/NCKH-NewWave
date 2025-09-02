// ===================== Utilities =====================
}
$('btnRefresh').addEventListener('click', refreshAll);
$('btnToggleMode').addEventListener('click', toggleMode);
}


async function refreshAll(){
$('statusMsg').textContent = 'Đang đồng bộ dữ liệu…';
$('statusDot').style.background = 'var(--warn)';
try{
if(db){
const base = refDB(db, `/plants/${plantId}`);
const [sensorSnap, timeSnap, infoSnap] = await Promise.all([
getDB(childDB(base,'Sensor')),
getDB(childDB(base,'Time')),
getDB(childDB(base,'Info'))
]);
applySensor(sensorSnap.val());
applyTime(timeSnap.val());
applyInfo(infoSnap.val());
} else {
// Demo fallback
applyInfo({name:'Monstera', location:'Ban công A3', mode:'auto'});
applySensor({ Temperature: 28.4, Humidity: 63, "Soil moisture": 42, "Light sensor": 720, Camera: '' });
applyTime({ Light: {"Time on": "06:30", "Time off": "22:00"}, Motor: {"Time on": "08:00", "Time off": "08:05"} });
}
$('statusMsg').textContent = 'Đã cập nhật.';
$('statusDot').style.background = 'var(--ok)';
$('lastUpdated').textContent = ts();
}catch(err){
showError('Lỗi tải dữ liệu: '+ err.message);
}
}


function applyInfo(info={}){
$('plantName').textContent = info.name || '—';
$('plantLocation').textContent = info.location || '—';
$('plantMode').textContent = (info.mode||'—').toUpperCase();
$('btnToggleMode').textContent = `Chuyển chế độ (${(info.mode==='auto'?'Thủ công':'Tự động')})`;
}
function applyTime(time={}){
$('lightOn').textContent = time?.Light?.['Time on'] ?? '—';
$('lightOff').textContent = time?.Light?.['Time off'] ?? '—';
$('motorOn').textContent = time?.Motor?.['Time on'] ?? '—';
$('motorOff').textContent = time?.Motor?.['Time off'] ?? '—';
}
function applySensor(s={}, live){
const t = n(s.Temperature), h = n(s.Humidity), soil = n(s['Soil moisture']);
const light = s['Light sensor'];
$('tempVal').textContent = Number.isFinite(t)? t : '—';
$('humVal').textContent = Number.isFinite(h)? h : '—';
$('soilVal').textContent = Number.isFinite(soil)? soil : '—';
$('lightVal').textContent = light ?? '—';


classify('mTemp', t, {low:18, high:32});
classify('mHum', h, {low:40, high:80});
classify('mSoil', soil, {low:35, high:65});


if(s.Camera){ loadImageFromCameraField(s.Camera).catch(e=> showError('Không tải được ảnh: '+e.message)); }
if(!live) $('lastUpdated').textContent = ts();
}


async function loadImageFromCameraField(field){
const img = $('plantImage');
const sk = $('imgSkeleton');
img.classList.add('hidden');
sk.classList.remove('hidden');
let url = null;
if(typeof field === 'string' && field.startsWith('data:image')) url = field;
else if(typeof field === 'string' && /^https?:\/\//.test(field)) url = field;
else if(typeof field === 'string' && window.firebase) url = null; // not used (we import modular)
else if(typeof field === 'string' && storage){
const { ref } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js');
url = await getDownloadURL(ref(storage, field));
}
if(url){
img.src = url + (url.includes('?')?'&':'?') + 't=' + Date.now();
img.onload = ()=>{ sk.classList.add('hidden'); img.classList.remove('hidden'); $('imgUpdated').textContent = 'Cập nhật ảnh: ' + ts(); };
img.onerror = ()=>{ sk.classList.add('hidden'); $('imgUpdated').textContent = 'Không hiển thị được ảnh'; };
} else { sk.classList.add('hidden'); $('imgUpdated').textContent = 'Chưa có ảnh từ cảm biến Camera'; }
}


async function toggleMode(){
if(!db){ return alert('Demo: không có DB để cập nhật.'); }
try{
const {ref, update, get} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js');
const base = ref(db, `/plants/${plantId}/Info`);
const snap = await get(base);
const cur = (snap.val()?.mode || 'auto');
const next = cur === 'auto' ? 'manual' : 'auto';
await update(base, {mode: next});
$('plantMode').textContent = next.toUpperCase();
$('btnToggleMode').textContent = `Chuyển chế độ (${next==='auto'?'Thủ công':'Tự động'})`;
$('statusMsg').textContent = 'Đã chuyển chế độ sang ' + next.toUpperCase();
}catch(err){ showError('Không cập nhật được chế độ: '+ err.message); }
}


function showError(msg){
const el = $('errorMsg');
el.textContent = msg; el.classList.remove('hidden');
}