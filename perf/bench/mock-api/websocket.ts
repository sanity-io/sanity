import {createHash} from 'node:crypto'
import type http from 'node:http'
import type net from 'node:net'

const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

export const OPCODE = {text: 0x1, close: 0x8, ping: 0x9, pong: 0xa} as const

/** Answer the upgrade handshake; false (socket destroyed) when the request is not a WebSocket one. */
export function acceptWebSocket(req: http.IncomingMessage, socket: net.Socket): boolean {
  const key = req.headers['sec-websocket-key']
  if (typeof key !== 'string') {
    socket.destroy()
    return false
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
  return true
}

/**
 * Accept a WebSocket handshake and then say nothing ("park" the socket).
 * Used for the bifur presence socket: rejecting the connection makes the
 * browser log console errors and the client reconnect-loop, while a silently
 * open socket lets presence degrade to "nobody else here" with zero noise.
 */
export function parkWebSocket(req: http.IncomingMessage, socket: net.Socket): void {
  if (acceptWebSocket(req, socket)) {
    // Ignore all frames and keep the socket open until the client goes away
    socket.on('data', () => {})
    socket.on('error', () => {})
  }
}

export interface WebSocketFrame {
  opcode: number
  payload: Buffer
}

const SHORT_LENGTH_16_BIT = 126
const SHORT_LENGTH_64_BIT = 127

function extendedLengthBytes(shortLength: number): number {
  switch (shortLength) {
    case SHORT_LENGTH_16_BIT:
      return 2
    case SHORT_LENGTH_64_BIT:
      return 8
    default:
      return 0
  }
}

function readPayloadLength(buffer: Buffer, frameStart: number, shortLength: number): number {
  switch (shortLength) {
    case SHORT_LENGTH_16_BIT:
      return buffer.readUInt16BE(frameStart + 2)
    case SHORT_LENGTH_64_BIT:
      return Number(buffer.readBigUInt64BE(frameStart + 2))
    default:
      return shortLength
  }
}

/**
 * Decode the complete client frames at the start of `buffer` (RFC 6455 §5.2;
 * client frames are always masked). Returns the undecoded tail for the next
 * chunk. Fragmented messages are not reassembled: browsers send the small
 * JSON-RPC requests bifur uses as single frames.
 */
export function decodeClientFrames(buffer: Buffer): {frames: WebSocketFrame[]; rest: Buffer} {
  const frames: WebSocketFrame[] = []
  let offset = 0
  while (buffer.length - offset >= 2) {
    const opcode = buffer[offset] & 0x0f
    const masked = (buffer[offset + 1] & 0x80) !== 0
    const shortLength = buffer[offset + 1] & 0x7f
    const headerBytes = 2 + extendedLengthBytes(shortLength) + (masked ? 4 : 0)
    if (buffer.length - offset < headerBytes) break
    const payloadLength = readPayloadLength(buffer, offset, shortLength)
    if (buffer.length - offset < headerBytes + payloadLength) break
    const payloadStart = offset + headerBytes
    const payload = Buffer.from(buffer.subarray(payloadStart, payloadStart + payloadLength))
    if (masked) {
      const mask = buffer.subarray(payloadStart - 4, payloadStart)
      payload.forEach((byte, index) => {
        payload[index] = byte ^ mask[index % 4]
      })
    }
    frames.push({opcode, payload})
    offset = payloadStart + payloadLength
  }
  return {frames, rest: buffer.subarray(offset)}
}

function encodeLengthHeader(length: number): Buffer {
  if (length < SHORT_LENGTH_16_BIT) {
    return Buffer.from([length])
  }
  if (length < 65_536) {
    return Buffer.from([SHORT_LENGTH_16_BIT, length >> 8, length & 0xff])
  }
  const extendedLength = Buffer.alloc(8)
  extendedLength.writeBigUInt64BE(BigInt(length))
  return Buffer.concat([Buffer.from([SHORT_LENGTH_64_BIT]), extendedLength])
}

/** Encode one final, unmasked server frame. */
export function encodeServerFrame(opcode: number, payload: Buffer): Buffer {
  return Buffer.concat([Buffer.from([0x80 | opcode]), encodeLengthHeader(payload.length), payload])
}
