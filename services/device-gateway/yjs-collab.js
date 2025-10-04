import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils.js'

export function setupYjsCollab({ server, bearerToken }) {
  const wss = new WebSocketServer({ server, path: '/collab' })

  wss.on('connection', (ws, req) => {
    if (bearerToken) {
      const authHeader = req.headers['authorization'] || ''
      if (authHeader !== `Bearer ${bearerToken}`) {
        ws.close(4001, 'unauthorized')
        return
      }
    }
    setupWSConnection(ws, req, { connect: true })
  })

  console.log('Yjs collab server mounted at /collab')
}
