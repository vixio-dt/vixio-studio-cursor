import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import fetch from 'node-fetch';
import { sendOsc } from './adapters/osc.js';
import { sendSacn } from './adapters/sacn.js';
import fs from 'fs';
import path from 'path';
import { setupYjsCollab } from './yjs-collab.js';

const app = express();
const port = process.env.PORT || 8080;
const BEARER_TOKEN = process.env.BEARER_TOKEN || '';

// Minimal CORS for browser fetches
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({ service: 'device-gateway', status: 'ok', endpoints: ['/health', '/ws'] });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Device Gateway listening on ${port}`);
});

setupYjsCollab({ server, bearerToken: BEARER_TOKEN });

const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'hello', message: 'connected' }));
  ws.on('message', (data) => {
    // In MVP, echo back. Later: translate to OSC/sACN/Art-Net
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  });
});

// Minimal HTTP cue proxy to the engine
function requireAuth(req, res, next) {
  if (!BEARER_TOKEN) return next();
  const h = req.headers['authorization'] || '';
  if (h === `Bearer ${BEARER_TOKEN}`) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

app.post('/cue/trigger', requireAuth, express.json(), async (req, res) => {
  const upstream = process.env.UPSTREAM_ENGINE_URL || 'http://cue-engine:8000';
  try {
    // Broadcast to connected WS clients for immediate preview
    try {
      const payload = JSON.stringify({ type: 'cue', ...(req.body || {}) });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
      });
    } catch {}

    // Optional protocol mappings (very small demo mappings)
    const body = req.body || {};
    try {
      // Explicit OSC mapping if provided
      if (body.protocol === 'osc' && body.address) {
        sendOsc(body.address, body.args || [], { host: body.host, port: body.port });
      }
      // Simple lighting level mapping to sACN
      if (body.id === 'lighting.level') {
        const start = Number(body.args?.start || 1);
        const count = Number(body.args?.count || 1);
        const level01 = Math.max(0, Math.min(1, Number(body.args?.level ?? 0)));
        const universe = Number(body.args?.universe || process.env.SACN_UNIVERSE || 1);
        const dest = body.args?.dest;
        const levels = new Array(512).fill(0);
        const val = Math.round(level01 * 255);
        for (let i = 0; i < count; i++) {
          const slot = start - 1 + i;
          if (slot >= 0 && slot < 512) levels[slot] = val;
        }
        sendSacn(levels, { universe, host: dest });
      }
    } catch (e) {
      console.warn('Mapping error:', e);
    }

    const r = await fetch(`${upstream}/cue/trigger`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    res.status(r.status).type(r.headers.get('content-type') || 'application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'upstream_error', detail: String(e) });
  }
});

// Timeline persistence
const DATA_DIR = process.env.DATA_DIR || '/data';
const TL_FILE = path.join(DATA_DIR, 'timeline.json');
const STORY_FILE = path.join(DATA_DIR, 'story.json');

function readJsonSafe(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return fallback; }
}
function writeJsonSafe(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}
app.get('/timeline', (_req, res) => {
  try {
    const buf = fs.readFileSync(TL_FILE);
    res.type('application/json').send(buf);
  } catch {
    res.json({ fps: 30, events: [] });
  }
});
app.post('/timeline', requireAuth, express.json({ limit: '1mb' }), (req, res) => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(TL_FILE, JSON.stringify(req.body || { fps:30, events:[] }, null, 2));
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: 'timeline_write_failed', detail: String(e) });
  }
});

// Story CRUD and publish
app.get('/story', (_req, res) => {
  const story = readJsonSafe(STORY_FILE, { idea:{ text:'', tags:[], notes:'' }, characters:[], beats:[], cues:[], meta:{ version:1 } });
  res.json(story);
});

function validateStory(story) {
  const errors = [];
  const idSet = new Set();
  for (const b of story.beats || []) {
    if (!b.id) errors.push('beat missing id');
    if (b.id && idSet.has(b.id)) errors.push(`duplicate beat id ${b.id}`);
    if (b.id) idSet.add(b.id);
  }
  const beatIds = new Set((story.beats||[]).map(b=>b.id));
  for (const c of story.cues || []) {
    if (!c.id) errors.push('cue missing id');
    if (c.beatId && !beatIds.has(c.beatId)) errors.push(`cue ${c.id} references missing beatId ${c.beatId}`);
    if (c.type && c.type.startsWith('lighting')) {
      const a = c.args||{}; const start=a.start||1, count=a.count||1, level=a.level||0, uni=a.universe||0;
      if (start<1||start>512) errors.push(`cue ${c.id} lighting start out of range`);
      if (start+count-1>512) errors.push(`cue ${c.id} lighting slots exceed 512`);
      if (level<0||level>1) errors.push(`cue ${c.id} lighting level 0..1`);
      if (uni<=0) errors.push(`cue ${c.id} lighting universe must be >0`);
    }
    if (c.trigger) {
      const k=c.trigger.kind; if (!['manual','state','timecode'].includes(k)) errors.push(`cue ${c.id} invalid trigger.kind`);
    }
  }
  return errors;
}

app.post('/story', requireAuth, express.json({ limit: '2mb' }), (req, res) => {
  const story = req.body || {};
  const errors = validateStory(story);
  if (errors.length) return res.status(400).json({ error:'validation_failed', errors });
  try { writeJsonSafe(STORY_FILE, story); return res.status(201).json({ status:'ok' }); }
  catch(e){ return res.status(500).json({ error:'story_write_failed', detail:String(e) }); }
});

function compileStoryToTimeline(story) {
  const warnings = [];
  // determine beat times
  const defaultSpacing = 3.0;
  const beatMap = new Map();
  const ordered = [...(story.beats||[])].sort((a,b)=> (a.order??0)-(b.order??0));
  let tCursor = 0;
  for (const b of ordered) {
    let t = undefined;
    // if any cues on the beat have timecode trigger, use that time
    const beatCues = (story.cues||[]).filter(c=>c.beatId===b.id);
    const tcCue = beatCues.find(c=>c.trigger && c.trigger.kind==='timecode' && c.trigger.tc);
    if (tcCue) {
      // naive hh:mm:ss:ff → seconds (frame ignored)
      const parts=String(tcCue.trigger.tc).split(':').map(Number); if (parts.length>=3) t = (parts[0]*3600)+(parts[1]*60)+(parts[2]||0);
    }
    if (t===undefined && typeof b.tHint==='number') t=b.tHint;
    if (t===undefined) { t=tCursor; tCursor+=defaultSpacing; }
    if (beatMap.has(t)) warnings.push(`time collision at ${t}s`);
    beatMap.set(b.id, t);
  }
  // build events
  const events = [];
  for (const c of (story.cues||[])) {
    const t = beatMap.get(c.beatId);
    if (t===undefined) { warnings.push(`cue ${c.id} missing beat time`); continue; }
    const payload = { id: c.type, args: c.args||{} };
    events.push({ t, payload, meta:{ priority: c.priority??50 } });
  }
  // sort events by time then priority desc
  events.sort((a,b)=> a.t===b.t ? ( (b.meta?.priority??0)-(a.meta?.priority??0) ) : (a.t-b.t));
  return { fps: 30, events, warnings };
}

app.post('/story/publish', requireAuth, async (_req, res) => {
  try {
    const story = readJsonSafe(STORY_FILE, null);
    if (!story) return res.status(404).json({ error:'no_story' });
    const errors = validateStory(story);
    if (errors.length) return res.status(400).json({ error:'validation_failed', errors });
    const tl = compileStoryToTimeline(story);
    writeJsonSafe(TL_FILE, tl);
    res.json({ status:'ok', events: tl.events.length, warnings: tl.warnings||[] });
  } catch(e){ res.status(500).json({ error:'publish_failed', detail:String(e) }); }
});

// AI idea expansion (optional external provider)
app.post('/ai/expand', requireAuth, express.json({ limit: '4mb' }), async (req, res) => {
  const idea = String((req.body && req.body.idea) || '').trim();
  const style = String((req.body && req.body.style) || '').trim();
  if (!idea) return res.status(400).json({ error: 'missing_idea' });

  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  try {
    if (provider === 'ollama' && process.env.OLLAMA_URL && process.env.OLLAMA_MODEL) {
      const body = {
        model: process.env.OLLAMA_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert show-control dramaturg. Return only JSON matching the schema.' },
          { role: 'user', content: `Expand this idea into an experience outline with beats and suggested spatial/lighting/media cues. Style: ${style || 'operator-friendly'}. Return JSON: {title:string, beats:[{t:number, id:string, description:string, cues?:[{id:string,args?:object}]}]}` },
          { role: 'user', content: idea }
        ],
        stream: false
      };
      const r = await fetch(`${process.env.OLLAMA_URL.replace(/\/$/, '')}/api/chat`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      });
      const json = await r.json();
      const content = json && json.message && json.message.content || '';
      let outline;
      try { outline = JSON.parse(content); } catch { outline = { title: 'Outline', beats: [] }; }
      return res.json({ provider: 'ollama', outline });
    }
    if (provider === 'openai' && (process.env.OPENAI_API_KEY || process.env.OPENROUTER_KEY_GROK || process.env.OPENROUTER_KEY_DEEPSEEK)) {
      const usedModel = process.env.OPENAI_MODEL || 'x-ai/grok-4-fast:free';
      let apiKey = process.env.OPENAI_API_KEY || '';
      const lower = usedModel.toLowerCase();
      if (lower.includes('deepseek')) apiKey = process.env.OPENROUTER_KEY_DEEPSEEK || apiKey;
      if (lower.includes('grok')) apiKey = process.env.OPENROUTER_KEY_GROK || apiKey;
      const body = {
        model: usedModel,
        messages: [
          { role: 'system', content: 'You are an expert show-control dramaturg. Return only JSON matching the schema.' },
          { role: 'user', content: `Expand this idea into an experience outline with beats and suggested spatial/lighting/media cues. Style: ${style || 'operator-friendly'}. Return JSON: {title:string, beats:[{t:number, id:string, description:string, cues?:[{id:string,args?:object}]}]}` },
          { role: 'user', content: idea }
        ],
        temperature: 0.4
      };
      const r = await fetch((process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1') + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body)
      });
      const json = await r.json();
      const content = (json && json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || '';
      let outline;
      try { outline = JSON.parse(content); } catch { outline = { title: 'Outline', beats: [] }; }
      return res.json({ provider: 'openai', model: usedModel, outline });
    }
  } catch (e) {
    console.warn('AI provider error', e);
  }

  // Fallback: simple rule-based outline
  const sentences = idea.split(/\.|\n/).map(s => s.trim()).filter(Boolean);
  const beats = sentences.slice(0, 6).map((s, i) => ({ t: 5 * (i + 1), id: `beat-${i+1}`, description: s }));
  return res.json({ provider: 'fallback', outline: { title: 'Outline', beats } });
});

// Transport/playhead proxy
app.post('/playhead', express.json(), async (req, res) => {
  const upstream = process.env.UPSTREAM_ENGINE_URL || 'http://cue-engine:8000';
  try {
    const r = await fetch(`${upstream}/playhead`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const text = await r.text();
    res.status(r.status).type(r.headers.get('content-type') || 'application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'upstream_error', detail: String(e) });
  }
});
