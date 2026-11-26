// Quản lý kết nối Server-Sent Events (SSE) đẩy cập nhật dữ liệu thời gian thực sang trình duyệt

const clients = new Set();
let pendingBroadcastTimer = null;
let lastPayload = null;

function addClient(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, ts: Date.now() })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch (_) {
      cleanup();
    }
  }, 25000);
  if (typeof heartbeat.unref === 'function') {
    heartbeat.unref();
  }

  const client = { req, res, heartbeat };
  clients.add(client);

  function cleanup() {
    clearInterval(heartbeat);
    clients.delete(client);
  }

  req.on('aborted', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
}

function sendToAll(eventName, data) {
  const serialized = JSON.stringify(data || { ts: Date.now() });
  const frame = `event: ${eventName}\ndata: ${serialized}\n\n`;
  for (const client of Array.from(clients)) {
    try {
      if (!client.res.writableEnded) {
        client.res.write(frame);
      } else {
        clearInterval(client.heartbeat);
        clients.delete(client);
      }
    } catch (_) {
      clearInterval(client.heartbeat);
      clients.delete(client);
    }
  }
}

function broadcast(eventName = 'database_updated', data = {}) {
  if (clients.size === 0) return;
  lastPayload = { eventName, data: { ...data, ts: Date.now() } };
  if (pendingBroadcastTimer) return;
  pendingBroadcastTimer = setTimeout(() => {
    pendingBroadcastTimer = null;
    if (lastPayload) {
      sendToAll(lastPayload.eventName, lastPayload.data);
      lastPayload = null;
    }
  }, 60);
  if (typeof pendingBroadcastTimer.unref === 'function') {
    pendingBroadcastTimer.unref();
  }
}

function getClientCount() {
  return clients.size;
}

module.exports = {
  addClient,
  broadcast,
  getClientCount
};
