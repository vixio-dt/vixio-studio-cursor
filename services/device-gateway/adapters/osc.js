import osc from 'osc';

let udpPort = null;

function getPort(host, port) {
  if (udpPort && udpPort.options.remoteAddress === host && udpPort.options.remotePort === port) return udpPort;
  if (udpPort) try { udpPort.close(); } catch {}
  udpPort = new osc.UDPPort({ remoteAddress: host, remotePort: port });
  udpPort.open();
  return udpPort;
}

export function sendOsc(address, args = [], options = {}) {
  const enabled = String(process.env.OSC_ENABLED || '').toLowerCase() === 'true';
  const host = options.host || process.env.OSC_HOST || '127.0.0.1';
  const port = Number(options.port || process.env.OSC_PORT || 9000);
  if (!enabled) return false;
  const a = Array.isArray(args) ? args : [args];
  try {
    const p = getPort(host, port);
    p.send({ address, args: a });
    console.log(`[OSC] -> ${host}:${port} ${address}`, a);
    return true;
  } catch (e) {
    console.warn('[OSC] send error', e);
    return false;
  }
}

