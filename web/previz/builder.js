const httpUrl = import.meta.env.VITE_GATEWAY_HTTP_URL || 'http://localhost:8080';
const wrap = document.getElementById('canvasWrap');
const inner = document.getElementById('canvasInner');
const lanesLayer = document.getElementById('lanes');
const edgesSvg = document.getElementById('edges');
const miniMap = document.getElementById('miniMap');
const statusEl = document.getElementById('status');
const warningsEl = document.getElementById('warnings');

let story = { idea:{ text:'', tags:[], notes:'' }, characters:[], beats:[], cues:[], meta:{ version:1 } };
let scale = 1, offsetX = 0, offsetY = 0;
let selectedId = null;
let dragConnection = null;
let selectedCueId = null;

const zoneColors = ['#8dd3ff','#eaf3b0','#ffb0d9','#c3b0ff'];

function setStatus(s){ statusEl.textContent = s; setTimeout(()=> statusEl.textContent='', 1200); }

function renderLanes(){
  const zones = Array.from(new Set((story.beats||[]).map(b=>b.zone||''))).filter(Boolean);
  lanesLayer.innerHTML = '';
  if (!zones.length) return;
  const laneHeight = 220;
  zones.forEach((zone, idx) => {
    const lane = document.createElement('div');
    lane.style.position='absolute';
    lane.style.top = (idx*laneHeight)+'px';
    lane.style.left='0'; lane.style.right='0'; lane.style.height=(laneHeight-20)+'px';
    lane.style.borderTop=`1px dashed rgba(141,211,255,0.2)`;
    lane.style.borderBottom=`1px dashed rgba(141,211,255,0.2)`;
    lane.style.color='rgba(230,240,255,0.45)';
    lane.style.fontSize='12px'; lane.style.padding='4px 8px';
    lane.textContent=zone || 'Main';
    lanesLayer.appendChild(lane);
  });
}

function renderEdges(){
  edgesSvg.innerHTML='';
  const svgNS='http://www.w3.org/2000/svg';
  edgesSvg.setAttribute('width','3000');
  edgesSvg.setAttribute('height','2000');
  const nodes = new Map((story.beats||[]).map(b=>[b.id,b]));
  const sorted = [...(story.beats||[])].sort((a,b)=> (a.order??0)-(b.order??0));
  for (let i=0;i<sorted.length-1;i++){
    const a=sorted[i], b=sorted[i+1];
    if (!a || !b) continue;
    const path = document.createElementNS(svgNS,'path');
    const ax=(a.x||100)+90, ay=(a.y||100)+30;
    const bx=(b.x||100), by=(b.y||100)+30;
    const d=`M ${ax} ${ay} C ${ax+80} ${ay}, ${bx-80} ${by}, ${bx} ${by}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke','rgba(141,211,255,0.4)');
    path.setAttribute('stroke-width','2');
    path.setAttribute('fill','none');
    edgesSvg.appendChild(path);
  }
}

function renderNodes(){
  inner.querySelectorAll('.node').forEach(n=>n.remove());
  renderLanes();
  for (const b of story.beats){
    const n = document.createElement('div');
    n.className = 'node' + (b.id===selectedId ? ' selected' : '');
    const x = b.x ?? (Math.random()*400+120);
    const y = b.y ?? 120;
    n.style.left = x+'px';
    n.style.top = y+'px';
    n.dataset.id = b.id;
    const cues = (story.cues||[]).filter(c=>c.beatId===b.id);
    const cueHtml = cues.map(c=>`<span class="cue-pill">${c.type}</span>`).join('');
    const zoneColor = zoneColors[ (story.beats.indexOf(b) % zoneColors.length) ];
    n.style.borderColor = zoneColor;
    n.innerHTML = `<div style="font-weight:600; margin-bottom:4px;">${b.title||b.id}</div><div class="badge">${b.zone||'zone'}</div>${cueHtml}`;
    makeDraggable(n);
    n.addEventListener('mousedown', (e)=>{
      if (e.altKey) { dragConnection = { from:b.id }; e.stopPropagation(); }
    });
    n.addEventListener('mouseup', ()=>{
      if (dragConnection && dragConnection.from && dragConnection.from!==b.id) {
        const fromBeat = story.beats.find(x=>x.id===dragConnection.from);
        const toBeat = story.beats.find(x=>x.id===b.id);
        if (fromBeat && toBeat) {
          const temp = fromBeat.order ?? 0;
          fromBeat.order = Math.min(temp, (toBeat.order ?? temp+1) - 1);
          toBeat.order = (toBeat.order ?? temp+1);
          renderNodes();
        }
      }
      dragConnection=null;
    });
    n.onclick = (e)=>{ selectedId = b.id; selectedCueId=null; fillInspector(); refreshCueList(); fillCueEditor(); renderNodes(); e.stopPropagation(); };
    inner.appendChild(n);
  }
  renderEdges();
  renderMiniMap();
}

function makeDraggable(el){
  let sx=0, sy=0, ox=0, oy=0, dragging=false;
  el.addEventListener('mousedown', (e)=>{ dragging=true; sx=e.clientX; sy=e.clientY; ox=parseInt(el.style.left)||0; oy=parseInt(el.style.top)||0; });
  window.addEventListener('mousemove', (e)=>{ if(!dragging) return; const dx=e.clientX-sx, dy=e.clientY-sy; el.style.left=(ox+dx)+'px'; el.style.top=(oy+dy)+'px'; });
  window.addEventListener('mouseup', ()=>{ if(!dragging) return; dragging=false; const id=el.dataset.id; const b=story.beats.find(x=>x.id===id); if(b){ b.x=parseInt(el.style.left)||0; b.y=parseInt(el.style.top)||0; }});
}

function fillInspector(){
  const b = story.beats.find(x=>x.id===selectedId);
  document.getElementById('i_id').value = b?b.id:'';
  document.getElementById('i_title').value = b? (b.title||'') : '';
  document.getElementById('i_zone').value = b? (b.zone||'') : '';
  document.getElementById('i_thint').value = b && typeof b.tHint==='number' ? b.tHint : '';
  document.getElementById('i_order').value = b && typeof b.order==='number' ? b.order : '';
}

function bindInspector(){
  document.getElementById('i_title').oninput = (e)=>{ const b=story.beats.find(x=>x.id===selectedId); if(b){ b.title=e.target.value; renderNodes(); }};
  document.getElementById('i_zone').oninput = (e)=>{ const b=story.beats.find(x=>x.id===selectedId); if(b){ b.zone=e.target.value; renderNodes(); }};
  document.getElementById('i_thint').oninput = (e)=>{ const b=story.beats.find(x=>x.id===selectedId); if(b){ const v=e.target.value; b.tHint = v===''?undefined:Number(v); }};
  document.getElementById('i_order').oninput = (e)=>{ const b=story.beats.find(x=>x.id===selectedId); if(b){ const v=e.target.value; b.order = v===''?undefined:Number(v); }};
  document.getElementById('i_delete').onclick = ()=>{ story.beats = story.beats.filter(x=>x.id!==selectedId); selectedId=null; renderNodes(); fillInspector(); };
}

document.getElementById('addBeat').onclick = ()=>{
  const id = `beat-${Date.now().toString(36)}`;
  const laneIndex = story.beats.length % 3;
  story.beats.push({ id, title:'Beat', order: (story.beats.length+1), zone: `Zone ${laneIndex+1}`, x: 120 + laneIndex*220, y: 120 + laneIndex*180 });
  selectedId = id; renderNodes(); fillInspector();
};

document.getElementById('saveStory').onclick = async ()=>{
  const headers = { 'Content-Type': 'application/json' };
  const token = (window.localStorage && localStorage.getItem('vixio_token')) || '';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${httpUrl}/story`, { method:'POST', headers, body: JSON.stringify(story) });
  if (r.ok) setStatus('Saved'); else setStatus('Save failed');
};

document.getElementById('publishStory').onclick = async ()=>{
  const headers = { 'Content-Type': 'application/json' };
  const token = (window.localStorage && localStorage.getItem('vixio_token')) || '';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${httpUrl}/story/publish`, { method:'POST', headers });
  const json = await r.json().catch(()=>null);
  if (r.ok) {
    setStatus(`Published ${json?.events||0} events`);
    warningsEl.textContent = json?.warnings?.length ? json.warnings.join('\n') : '';
  } else {
    setStatus('Publish failed');
    warningsEl.textContent = json?.errors?.join('\n') || '';
  }
};

wrap.onclick = ()=>{ selectedId=null; renderNodes(); fillInspector(); };

function applyTransform(){ inner.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`; }
wrap.addEventListener('wheel', (e)=>{ e.preventDefault(); const k = e.deltaY>0 ? 0.9 : 1.1; scale = Math.max(0.3, Math.min(2.5, scale*k)); applyTransform(); }, { passive:false });
let draggingCanvas=false, panStartX=0, panStartY=0;
wrap.addEventListener('mousedown', (e)=>{
  if (e.target===wrap) { draggingCanvas=true; panStartX=e.clientX; panStartY=e.clientY; }
});
window.addEventListener('mousemove', (e)=>{
  if (!draggingCanvas) return; const dx=e.clientX-panStartX, dy=e.clientY-panStartY; panStartX=e.clientX; panStartY=e.clientY; offsetX+=dx; offsetY+=dy; applyTransform(); });
window.addEventListener('mouseup', ()=> draggingCanvas=false );

function renderMiniMap(){
  miniMap.innerHTML='';
  const scaleFactor=0.08;
  for (const b of story.beats){
    const rect=document.createElement('div'); rect.style.left=(b.x||0)*scaleFactor+'px'; rect.style.top=(b.y||0)*scaleFactor+'px'; rect.style.width=(180*scaleFactor)+'px'; rect.style.height=(60*scaleFactor)+'px'; miniMap.appendChild(rect);
  }
}

function refreshCueList(){
  const cueItems=document.getElementById('cueItems'); cueItems.innerHTML='';
  if (!selectedId) return;
  (story.cues||[]).filter(c=>c.beatId===selectedId).forEach((c)=>{
    const div=document.createElement('div'); div.className='cue-item'+(c.id===selectedCueId?' selected':'');
    div.innerHTML=`<div style="font-weight:600">${c.type}</div><div style="opacity:.75">priority ${c.priority||50}, trigger ${c.trigger?.kind||'manual'}</div>`;
    div.onclick=()=>{ selectedCueId=c.id; refreshCueList(); fillCueEditor(); };
    cueItems.appendChild(div);
  });
}

document.getElementById('cue_add').onclick = ()=>{
  if (!selectedId) { setStatus('Select a beat first'); return; }
  const type=document.getElementById('cue_type').value;
  const trig=document.getElementById('cue_trigger').value;
  const trigVal=document.getElementById('cue_trigger_val').value.trim();
  const priority=Number(document.getElementById('cue_priority').value||50);
  const id=`cue-${Date.now().toString(36)}`;
  const cue={ id, beatId:selectedId, type, args:{}, trigger:{ kind:trig }, priority };
  if (trig==='timecode') cue.trigger.tc=trigVal||'00:00:05';
  if (trig==='state') cue.trigger.when=trigVal||'state.key';
  story.cues.push(cue);
  selectedCueId = id;
  refreshCueList(); renderNodes(); fillCueEditor();
};

async function load(){
  try { const r = await fetch(`${httpUrl}/story`); story = await r.json(); } catch {}
  renderNodes(); fillInspector(); bindInspector(); applyTransform(); refreshCueList(); fillCueEditor();
}
load();

function fillCueEditor(){
  const container=document.getElementById('cueEdit');
  if (!selectedCueId) { container.style.display='none'; return; }
  const cue=(story.cues||[]).find(c=>c.id===selectedCueId);
  if (!cue) { container.style.display='none'; return; }
  container.style.display='block';
  document.getElementById('cue_edit_id').value=cue.id;
  document.getElementById('cue_edit_type').value=cue.type;
  document.getElementById('cue_edit_priority').value=cue.priority ?? 50;
  document.getElementById('cue_edit_trigger').value=cue.trigger?.kind || 'manual';
  document.getElementById('cue_edit_trigger_val').value=cue.trigger?.tc || cue.trigger?.when || '';
  document.getElementById('cue_edit_args').value=JSON.stringify(cue.args||{}, null, 2);
}

document.getElementById('cue_edit_trigger').onchange = fillCueEditor;

document.getElementById('cue_update').onclick = ()=>{
  if (!selectedCueId) return;
  const cue=(story.cues||[]).find(c=>c.id===selectedCueId);
  if (!cue) return;
  cue.priority = Number(document.getElementById('cue_edit_priority').value||50);
  const kind=document.getElementById('cue_edit_trigger').value;
  const val=document.getElementById('cue_edit_trigger_val').value.trim();
  cue.trigger = { kind };
  if (kind==='timecode') cue.trigger.tc = val || '00:00:05';
  if (kind==='state') cue.trigger.when = val || 'state.key';
  try { cue.args = JSON.parse(document.getElementById('cue_edit_args').value||'{}'); }
  catch { setStatus('Invalid JSON in args'); return; }
  setStatus('Cue updated'); refreshCueList(); renderNodes();
};

document.getElementById('cue_remove').onclick = ()=>{
  if (!selectedCueId) return;
  story.cues = story.cues.filter(c=>c.id!==selectedCueId);
  selectedCueId=null; refreshCueList(); renderNodes(); fillCueEditor();
};



