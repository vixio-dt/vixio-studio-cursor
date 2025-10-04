import fetch from 'node-fetch';
import e131 from 'e131';

const clients = new Map();

function getClient(host) {
  if (clients.has(host)) return clients.get(host);
  const c = new e131.Client(host);
  clients.set(host, c);
  return c;
}

export async function sendSacn(levels = [], options = {}) {
  const enabled = String(process.env.SACN_ENABLED || '').toLowerCase() === 'true';
  if (!enabled) return false;
  const universe = Number(options.universe || process.env.SACN_UNIVERSE || 1);
  const dest = options.host || process.env.SACN_TARGET_HOST || '127.0.0.1';
  const clamped = levels.map((v) => Math.max(0, Math.min(255, Math.round(v))));

  // Prefer direct e131 if enabled, else use bridge if configured
  const useDirect = String(process.env.SACN_DIRECT || '').toLowerCase() === 'true';
  if (useDirect) {
    try {
      const client = getClient(dest);
      // Create a 512-slot packet and set universe
      const packet = client.createPacket(512);
      if (typeof packet.setUniverse === 'function') packet.setUniverse(universe);
      const slots = (typeof packet.getSlots === 'function') ? packet.getSlots() : (packet.getSlotsData ? packet.getSlotsData() : null);
      if (slots) {
        for (let i = 0; i < Math.min(slots.length, clamped.length); i++) slots[i] = clamped[i];
      }
      client.send(packet, () => {});
      const preview = clamped.slice(0, 12);
      console.log(`[sACN] -> e131 ${dest} universe ${universe}, ${clamped.length} slots, first12=${preview.join(',')}`);
      return true;
    } catch (e) {
      console.warn('[sACN] e131 error, falling back to bridge (if set)', e);
    }
  }

  // Bridge fallback
  const bridge = process.env.SACN_BRIDGE_URL;
  if (!bridge) return false;
  try {
    const r = await fetch(`${bridge}/levels`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ universe, levels: clamped, dest })
    });
    const ok = r.ok;
    const preview = clamped.slice(0, 12);
    console.log(`[sACN] -> bridge ${bridge} universe ${universe}, ${clamped.length} slots, first12=${preview.join(',')}`);
    return ok;
  } catch (e) {
    console.warn('[sACN] bridge error', e);
    return false;
  }
}


