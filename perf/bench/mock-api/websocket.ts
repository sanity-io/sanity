import {createHash} from 'node:crypto'
import type http from 'node:http'
import type net from 'node:net'

const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

/**
 * Accept a WebSocket handshake and then say nothing ("park" the socket).
 * Used for the bifur presence socket: rejecting the connection makes the
 * browser log console errors and the client reconnect-loop, while a silently
 * open socket lets presence degrade to "nobody else here" with zero noise.
 */
export function parkWebSocket(req: http.IncomingMessage, socket: net.Socket): void {
  const key = req.headers['sec-websocket-key']
  if (typeof key !== 'string') {
    socket.destroy()
    return
  }
  const accept = createHash('sha1').update(`${key}${WEBSOCKET_GUID}`).digest('base64')
  socket.write(
    [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`,
      '',
      '',
    ].join('\r\n'),
  )
  // Ignore all frames and keep the socket open until the client goes away
  socket.on('data', () => {})
  socket.on('error', () => {})
}
