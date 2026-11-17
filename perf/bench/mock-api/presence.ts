import type http from 'node:http'
import type net from 'node:net'

import {
  acceptWebSocket,
  decodeClientFrames,
  encodeServerFrame,
  OPCODE,
  parkWebSocket,
} from './websocket'

/**
 * The bifur presence socket (`/socket/<dataset>`, JSON-RPC 2.0 over text
 * frames — `@sanity/bifur-client`). Parked by default (see `parkWebSocket`):
 * every mode except a soak that opts in measures a studio with presence
 * silently disabled, and must keep doing so. A soak with `presence` set
 * switches the hub to live for its session: requests are answered, so the
 * studio authorizes, subscribes and announces its own location, and an
 * optional peer shows up on the document.
 */

export interface PresencePeer {
  userId: string
  displayName: string
  documentId: string
  paths: string[][]
}

interface BifurRequest {
  id?: string
  method?: string
  params?: {subscriptionId?: string}
}

export type BifurMessage = Record<string, unknown>

const PEER_SESSION_ID = 'bench-peer-session'

/**
 * One socket's protocol state, separated from the transport so it can be
 * tested without a WebSocket: each client message maps to the messages the
 * mock sends back.
 */
export class BifurSession {
  private subscriptions: string[] = []
  private nextSubscription = 0

  constructor(private readonly peerState: () => BifurMessage | null) {}

  handle(request: BifurRequest): BifurMessage[] {
    if (request.id === undefined || request.method === undefined) return []
    const reply = (result: unknown) => ({jsonrpc: '2.0', id: request.id, result})
    switch (request.method) {
      case 'presence_subscribe': {
        this.nextSubscription += 1
        const subscription = `presence-${this.nextSubscription}`
        this.subscriptions = [...this.subscriptions, subscription]
        // The studio sends its rollcall before it subscribes, so a peer that
        // only answered the rollcall would never be seen
        return [reply(subscription), ...notify([subscription], this.peerState())]
      }
      case 'presence_unsubscribe':
        this.subscriptions = this.subscriptions.filter(
          (subscription) => subscription !== request.params?.subscriptionId,
        )
        return [reply(true)]
      case 'presence_rollcall':
        return [reply(null), ...this.broadcast(this.peerState())]
      case 'authorization':
        return [reply(true)]
      default:
        return [reply(null)]
    }
  }

  /** `presence_subscription` notifications carrying `event` to every subscription. */
  broadcast(event: BifurMessage | null): BifurMessage[] {
    return notify(this.subscriptions, event)
  }
}

function notify(subscriptions: string[], event: BifurMessage | null): BifurMessage[] {
  if (event === null) return []
  return subscriptions.map((subscription) => ({
    jsonrpc: '2.0',
    method: 'presence_subscription',
    params: {subscription, result: event},
  }))
}

/** The peer's `state` event at `step` (it cycles through `paths`). */
export function peerStateEvent(peer: PresencePeer, step: number): BifurMessage {
  const path = peer.paths[step % peer.paths.length] ?? []
  return {
    type: 'state',
    i: peer.userId,
    m: {
      sessionId: PEER_SESSION_ID,
      locations: [
        {
          type: 'document',
          documentId: peer.documentId,
          path,
          lastActiveAt: new Date().toISOString(),
        },
      ],
    },
  }
}

export class PresenceHub {
  private live = false
  private peer: PresencePeer | null = null
  private peerStep = 0
  private readonly sockets = new Map<net.Socket, BifurSession>()

  /** Live presence for the next connections, with an optional peer; `reset` parks again. */
  setLive(peer?: PresencePeer): void {
    this.live = true
    this.peer = peer ?? null
    this.peerStep = 0
  }

  reset(): void {
    this.live = false
    this.peer = null
    this.peerStep = 0
    this.sockets.forEach((_, socket) => socket.destroy())
    this.sockets.clear()
  }

  /** The peer's user profile for `/users/<id>`, when `userId` is the peer. */
  userProfile(userId: string): {id: string; displayName: string} | null {
    return this.peer?.userId === userId
      ? {id: this.peer.userId, displayName: this.peer.displayName}
      : null
  }

  /** Move the peer to its next path and tell every connected studio. */
  advancePeer(): void {
    if (this.peer === null) return
    this.peerStep += 1
    const event = this.currentPeerState()
    this.sockets.forEach((session, socket) => send(socket, session.broadcast(event)))
  }

  readonly handleUpgrade = (
    req: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer = Buffer.alloc(0),
  ): void => {
    if (this.live) {
      this.serve(req, socket, head)
    } else {
      parkWebSocket(req, socket)
    }
  }

  private serve(req: http.IncomingMessage, socket: net.Socket, head: Buffer): void {
    if (acceptWebSocket(req, socket)) {
      this.attachSession(socket, head)
    }
  }

  private attachSession(socket: net.Socket, head: Buffer): void {
    const session = new BifurSession(() => this.currentPeerState())
    this.sockets.set(socket, session)
    let pending = head
    socket.on('data', (chunk: Buffer) => {
      const {frames, rest} = decodeClientFrames(Buffer.concat([pending, chunk]))
      pending = rest
      frames.forEach((frame) => {
        switch (frame.opcode) {
          case OPCODE.text:
            send(socket, session.handle(parseRequest(frame.payload)))
            break
          case OPCODE.ping:
            socket.write(encodeServerFrame(OPCODE.pong, frame.payload))
            break
          case OPCODE.close:
            socket.end(encodeServerFrame(OPCODE.close, frame.payload))
            break
        }
      })
    })
    socket.on('close', () => this.sockets.delete(socket))
    socket.on('error', () => {})
  }

  private currentPeerState(): BifurMessage | null {
    return this.peer === null ? null : peerStateEvent(this.peer, this.peerStep)
  }
}

function parseRequest(payload: Buffer): BifurRequest {
  try {
    return JSON.parse(payload.toString('utf8')) as BifurRequest
  } catch {
    return {}
  }
}

function send(socket: net.Socket, messages: BifurMessage[]): void {
  if (socket.destroyed) return
  messages.forEach((message) => {
    socket.write(encodeServerFrame(OPCODE.text, Buffer.from(JSON.stringify(message), 'utf8')))
  })
}
