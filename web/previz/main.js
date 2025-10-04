import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, Color3 } from 'babylonjs';

const canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
document.getElementById('app').appendChild(canvas);

const engine = new Engine(canvas, true);
const scene = new Scene(engine);
scene.clearColor = new Color3(0.05, 0.05, 0.07);

const camera = new ArcRotateCamera('cam', Math.PI / 3, Math.PI / 3, 8, Vector3.Zero(), scene);
camera.attachControl(canvas, true);
new HemisphericLight('light', new Vector3(0, 1, 0), scene);
MeshBuilder.CreateBox('room', { size: 2 }, scene);

engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());

const wsUrl = import.meta.env.VITE_GATEWAY_WS_URL || 'ws://localhost:8080/ws';
const httpUrl = import.meta.env.VITE_GATEWAY_HTTP_URL || 'http://localhost:8080';
const wsEl = document.getElementById('ws');
const socket = new WebSocket(wsUrl);
socket.onopen = () => (wsEl.textContent = 'connected');
socket.onclose = () => (wsEl.textContent = 'closed');
socket.onerror = () => (wsEl.textContent = 'error');
socket.onmessage = (ev) => {
  try {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'cue' && msg.id === 'room.scale') {
      const mesh = scene.getMeshByName('room');
      if (mesh && msg.args?.s) mesh.scaling.setAll(Number(msg.args.s) || 1);
    }
  } catch {}
};

// Basic timeline UI
const panel = document.createElement('div');
panel.style.position = 'absolute';
panel.style.right = '8px';
panel.style.bottom = '8px';
panel.style.background = 'rgba(15,15,20,0.8)';
panel.style.border = '1px solid #222';
panel.style.padding = '8px';
panel.style.color = '#e5e7eb';
panel.style.font = '12px system-ui';

panel.innerHTML = `
  <div style="margin-bottom:6px">Timeline</div>
  <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
    <button id="go1">GO: Scale 1.2</button>
    <button id="go2">GO: Scale 0.8</button>
    <button id="go3">GO: Reset</button>
  </div>
  <div style="margin-bottom:6px;">
    <a href="/builder.html" target="_blank" style="color:var(--brand-accent-1); text-decoration:none;">Open Story Builder ↗</a>
  </div>
  <hr class="accent"/>
  <div style="display:flex; gap:6px; align-items:center;">
    <label>Lighting 1-4:</label>
    <input id="lvl" type="range" min="0" max="1" step="0.05" value="0.5" />
    <span id="lvlv">0.50</span>
    <button id="sendLvl">Send</button>
  </div>
`;
document.body.appendChild(panel);

document.getElementById('go1').onclick = () => sendCue({ type:'cue', id:'room.scale', args:{ s:1.2 } });
document.getElementById('go2').onclick = () => sendCue({ type:'cue', id:'room.scale', args:{ s:0.8 } });
document.getElementById('go3').onclick = () => sendCue({ type:'cue', id:'room.scale', args:{ s:1.0 } });

const lvl = document.getElementById('lvl');
const lvlv = document.getElementById('lvlv');
lvl.oninput = () => { lvlv.textContent = Number(lvl.value).toFixed(2); };
document.getElementById('sendLvl').onclick = () => sendCue({ id:'lighting.level', args:{ universe:1, start:1, count:4, level:Number(lvl.value) } });

document.getElementById('expand').onclick = async () => {
  const idea = document.getElementById('idea').value.trim();
  if (!idea) return;
  const headers = { 'Content-Type': 'application/json' };
  const token = (window.localStorage && localStorage.getItem('vixio_token')) || '';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const modelSel = document.getElementById('model');
  const model = modelSel ? modelSel.value : undefined;
  const r = await fetch(`${httpUrl}/ai/expand`, { method:'POST', headers, body: JSON.stringify({ idea, model }) });
  const json = await r.json();
  const out = document.getElementById('ideaOut');
  out.textContent = JSON.stringify(json.outline || json, null, 2);
  // Offer quick import into timeline
  if (json && json.outline && Array.isArray(json.outline.beats)) {
    json.outline.beats.forEach((b) => {
      // Previz helper: drop a marker at an arbitrary position per beat
      if (typeof b.t === 'number' && b.id) timeline.events.push({ t:b.t, payload:{ id:'previz.marker.show', args:{ id:b.id, pos:{x:0,y:1,z:0} } } });
    });
    fired.clear();
    renderEventList();
  }
};

async function sendCue(payload) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = (window.localStorage && localStorage.getItem('vixio_token')) || '';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch(`${httpUrl}/cue/trigger`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('sendCue failed', e);
  }
}

// Timeline scrub bar + timecode (mock, 30 fps)
const tl = document.createElement('div');
tl.style.position = 'absolute';
tl.style.left = '8px';
tl.style.bottom = '8px';
tl.style.background = 'rgba(15,15,20,0.8)';
tl.style.border = '1px solid #222';
tl.style.padding = '8px';
tl.style.color = '#e5e7eb';
tl.style.font = '12px system-ui';
tl.innerHTML = `
  <div style="margin-bottom:6px; display:flex; align-items:center; gap:8px;">
    <span>Timecode</span>
    <code id="tc" style="background:#111; padding:2px 4px; border:1px solid #333">00:00:00:00</code>
    <button id="play">Play</button>
    <button id="pause">Pause</button>
    <button id="reset">Reset</button>
  </div>
  <input id="scrub" type="range" min="0" max="120" step="0.1" value="0" style="width:420px" />
`;
document.body.appendChild(tl);

let playheadSec = 0;
let playing = false;
const fps = 30;
const tcEl = document.getElementById('tc');
const scrub = document.getElementById('scrub');
let timeline = { fps: 30, events: [] };
let fired = new Set();

function toTc(sec, fps) {
  const totalFrames = Math.max(0, Math.round(sec * fps));
  const hours = Math.floor(totalFrames / (fps * 3600));
  const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
  const seconds = Math.floor((totalFrames % (fps * 60)) / fps);
  const frames = totalFrames % fps;
  const pad = (n, w=2) => String(n).padStart(w, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

function renderTc() {
  tcEl.textContent = toTc(playheadSec, fps);
  scrub.value = String(playheadSec.toFixed(1));
}

let lastTs = performance.now();
function tick(ts) {
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (playing) {
    const prev = playheadSec;
    playheadSec = Math.min(120, playheadSec + dt);
    renderTc();
    // Auto-fire from timeline.json
    for (const ev of timeline.events) {
      const id = `t${ev.t}`;
      if (!fired.has(id) && prev < ev.t && playheadSec >= ev.t) {
        fired.add(id);
        sendCue(ev.payload);
      }
    }
    // Emit playhead updates at ~10 Hz
    if (!tick._acc) tick._acc = 0;
    tick._acc += dt;
    if (tick._acc >= 0.1) {
      tick._acc = 0;
      fetch(`${httpUrl}/playhead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds: playheadSec })
      }).catch(() => {});
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
renderTc();

document.getElementById('play').onclick = () => { playing = true; };
document.getElementById('pause').onclick = () => { playing = false; };
document.getElementById('reset').onclick = () => { playing = false; playheadSec = 0; renderTc(); };
scrub.oninput = () => { playheadSec = Number(scrub.value) || 0; renderTc(); };

// Load timeline from gateway if available, else local
fetch(`${httpUrl}/timeline`).then(r => r.json()).then(json => {
  timeline = json || timeline;
  fired.clear();
}).catch(() => {
  fetch('/timeline.json').then(r => r.json()).then(json => { timeline = json || timeline; fired.clear(); }).catch(() => {});
});

// --- Simple Timeline Editor (add/import/export/delete) ---
const editor = document.createElement('div');
editor.style.position = 'absolute';
editor.style.left = '460px';
editor.style.bottom = '8px';
editor.style.background = 'rgba(15,15,20,0.8)';
editor.style.border = '1px solid #222';
editor.style.padding = '8px';
editor.style.color = '#e5e7eb';
editor.style.font = '12px system-ui';
editor.style.maxWidth = '460px';
editor.innerHTML = `
  <div style="margin-bottom:6px">Timeline Editor</div>
  <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:6px;">
    <label>@s</label>
    <input id="ev_t" type="number" min="0" step="0.1" style="width:80px"/>
    <label>Event</label>
    <select id="ev_type">
      <option value="room.scale">room.scale</option>
      <option value="lighting.level">lighting.level (1-4)</option>
    </select>
    <label>Value</label>
    <input id="ev_val" type="number" step="0.1" value="1.0" style="width:80px"/>
    <button id="ev_add">Add</button>
  </div>
  <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:6px;">
    <button id="ev_export">Export</button>
    <label style="border:1px solid #333; padding:3px 6px; cursor:pointer;">Import JSON<input id="ev_import" type="file" accept="application/json" style="display:none"/></label>
    <button id="ev_clearfired">Clear Fired</button>
  </div>
  <div id="ev_list" style="max-height:180px; overflow:auto; border:1px solid #222; padding:6px; background:#0d0f13;"></div>
`;
document.body.appendChild(editor);

function renderEventList() {
  const list = document.getElementById('ev_list');
  const rows = timeline.events
    .slice()
    .sort((a,b) => a.t - b.t)
    .map((ev, idx) => {
      const payload = ev.payload || {};
      const label = payload.id === 'lighting.level'
        ? `${payload.id}=${payload.args?.level ?? ''}`
        : `${payload.id}=${payload.args?.s ?? ''}`;
      return `<div style=\"display:flex;justify-content:space-between;gap:8px;align-items:center;border-bottom:1px solid #111;padding:2px 0\">
        <span style=\"opacity:0.85\">t=${ev.t.toFixed(1)} • ${label}</span>
        <button data-idx=\"${idx}\" class=\"ev_del\">✕</button>
      </div>`;
    }).join('');
  list.innerHTML = rows || '<em style="opacity:0.7">No events</em>';
  list.querySelectorAll('.ev_del').forEach(btn => {
    btn.onclick = () => {
      const i = Number(btn.getAttribute('data-idx'));
      timeline.events.splice(i, 1);
      fired.clear();
      renderEventList();
    };
  });
}
renderEventList();

document.getElementById('ev_add').onclick = () => {
  const t = Number(document.getElementById('ev_t').value || playheadSec || 0);
  const type = document.getElementById('ev_type').value;
  const val = Number(document.getElementById('ev_val').value || 1.0);
  const payload = type === 'lighting.level'
    ? { id:'lighting.level', args:{ universe:1, start:1, count:4, level: val } }
    : { type:'cue', id:'room.scale', args:{ s: val } };
  timeline.events.push({ t, payload });
  fired.clear();
  renderEventList();
};

document.getElementById('ev_export').onclick = () => {
  const blob = new Blob([JSON.stringify(timeline, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'timeline.json'; a.click();
  URL.revokeObjectURL(url);
};

document.getElementById('ev_import').onchange = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(String(r.result||'{}'));
      if (Array.isArray(data?.events)) {
        timeline = { fps: Number(data.fps||30), events: data.events };
        fired.clear();
        renderEventList();
      }
    } catch {}
  };
  r.readAsText(f);
};

document.getElementById('ev_clearfired').onclick = () => {
  fired.clear();
};

// Save to gateway
const saveBtn = document.createElement('button');
saveBtn.textContent = 'Save';
saveBtn.onclick = async () => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = (window.localStorage && localStorage.getItem('vixio_token')) || '';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch(`${httpUrl}/timeline`, { method:'POST', headers, body: JSON.stringify(timeline) });
  } catch {}
};
editor.querySelector('div:nth-child(2)').appendChild(saveBtn);


