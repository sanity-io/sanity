// @vitest-environment node
import {afterAll, afterEach, beforeAll, describe, expect, it} from 'vitest'

import {createMockApi, type MockApiServer} from '../createServer'
import {BifurSession, peerStateEvent, type PresencePeer} from '../presence'
import {decodeClientFrames, encodeServerFrame, OPCODE} from '../websocket'

const PORT = 43124

const PEER: PresencePeer = {
  userId: 'bench-peer',
  displayName: 'Bench Peer',
  documentId: 'drafts.doc',
  paths: [['body'], ['title']],
}

function maskedClientFrame(opcode: number, text: string): Buffer {
  const payload = Buffer.from(text, 'utf8')
  const mask = Buffer.from([0x12, 0x34, 0x56, 0x78])
  const lengthHeader =
    payload.length < 126
      ? Buffer.from([0x80 | payload.length])
      : Buffer.from([0x80 | 126, payload.length >> 8, payload.length & 0xff])
  const masked = payload.map((byte, index) => byte ^ mask[index % 4])
  return Buffer.concat([Buffer.from([0x80 | opcode]), lengthHeader, mask, masked])
}

describe('WebSocket frames', () => {
  it('unmasks complete client frames and keeps a partial tail', () => {
    const first = maskedClientFrame(OPCODE.text, '{"id":"1"}')
    const second = maskedClientFrame(OPCODE.text, 'x'.repeat(300))
    const partial = second.subarray(0, 10)
    const {frames, rest} = decodeClientFrames(Buffer.concat([first, partial]))
    expect(frames.map((frame) => frame.payload.toString('utf8'))).toEqual(['{"id":"1"}'])
    expect(rest).toEqual(partial)

    const resumed = decodeClientFrames(Buffer.concat([rest, second.subarray(10)]))
    expect(resumed.frames[0].payload.toString('utf8')).toBe('x'.repeat(300))
    expect(resumed.rest.length).toBe(0)
  })

  it('encodes unmasked server frames with the extended length forms', () => {
    expect([...encodeServerFrame(OPCODE.text, Buffer.from('hi'))]).toEqual([0x81, 2, 104, 105])
    const medium = encodeServerFrame(OPCODE.text, Buffer.alloc(300))
    expect([...medium.subarray(0, 4)]).toEqual([0x81, 126, 1, 44])
    const large = encodeServerFrame(OPCODE.text, Buffer.alloc(70_000))
    expect(large[1]).toBe(127)
    expect(Number(large.readBigUInt64BE(2))).toBe(70_000)
  })
})

describe('BifurSession', () => {
  it('answers every request so the client authorizes and announces', () => {
    const session = new BifurSession(() => null)
    expect(session.handle({id: 'a', method: 'authorization'})).toEqual([
      {jsonrpc: '2.0', id: 'a', result: true},
    ])
    expect(session.handle({id: 'b', method: 'presence_announce'})).toEqual([
      {jsonrpc: '2.0', id: 'b', result: null},
    ])
    expect(session.handle({method: 'presence_announce'})).toEqual([])
  })

  it('delivers the peer to a new subscription and on rollcall', () => {
    const session = new BifurSession(() => peerStateEvent(PEER, 0))
    const [subscribed, notification] = session.handle({id: 's', method: 'presence_subscribe'})
    expect(subscribed).toEqual({jsonrpc: '2.0', id: 's', result: 'presence-1'})
    expect(notification).toMatchObject({
      method: 'presence_subscription',
      params: {subscription: 'presence-1', result: {type: 'state', i: 'bench-peer'}},
    })
    expect(session.handle({id: 'r', method: 'presence_rollcall'})).toHaveLength(2)

    session.handle({
      id: 'u',
      method: 'presence_unsubscribe',
      params: {subscriptionId: 'presence-1'},
    })
    expect(session.broadcast(peerStateEvent(PEER, 1))).toEqual([])
  })

  it('moves the peer through its paths', () => {
    const pathAt = (step: number) =>
      (peerStateEvent(PEER, step).m as {locations: {path: string[]}[]}).locations[0].path
    expect([0, 1, 2].map(pathAt)).toEqual([['body'], ['title'], ['body']])
  })
})

describe('mock presence socket', () => {
  let mock: MockApiServer

  beforeAll(async () => {
    mock = createMockApi({port: PORT, projectId: 'benchexp', dataset: 'bench'})
    await mock.listen()
  })

  afterEach(() => {
    mock.presence.reset()
    mock.ledger.reset()
  })

  afterAll(async () => {
    await mock.close()
  })

  async function connect(): Promise<{socket: WebSocket; messages: unknown[]}> {
    const socket = new WebSocket(`ws://127.0.0.1:${PORT}/v2022-06-30/socket/bench`)
    const messages: unknown[] = []
    socket.addEventListener('message', (event) => messages.push(JSON.parse(String(event.data))))
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, {once: true})
      socket.addEventListener('error', reject, {once: true})
    })
    return {socket, messages}
  }

  const send = (socket: WebSocket, id: string, method: string) =>
    socket.send(JSON.stringify({jsonrpc: '2.0', id, method, params: {apiVersion: 'v1'}}))

  it('stays parked by default: the handshake succeeds and nothing is answered', async () => {
    const {socket, messages} = await connect()
    send(socket, 'a', 'authorization')
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(messages).toEqual([])
    socket.close()
  })

  it('answers when live and serves the peer profile', async () => {
    mock.presence.setLive(PEER)
    const {socket, messages} = await connect()
    send(socket, 'a', 'authorization')
    send(socket, 's', 'presence_subscribe')
    await expect.poll(() => messages.length).toBe(3)
    mock.presence.advancePeer()
    await expect.poll(() => messages.length).toBe(4)
    expect(messages.at(-1)).toMatchObject({
      params: {result: {m: {locations: [{path: ['title']}]}}},
    })
    socket.close()

    const response = await fetch(`http://127.0.0.1:${PORT}/v2021-06-07/users/bench-peer`)
    expect(await response.json()).toEqual([{id: 'bench-peer', displayName: 'Bench Peer'}])
    expect(mock.ledger.snapshot().unexpected).toEqual([])
  })

  it('leaves unknown user lookups unexpected', async () => {
    mock.presence.setLive(PEER)
    const response = await fetch(`http://127.0.0.1:${PORT}/v2021-06-07/users/someone-else`)
    expect(response.status).toBe(404)
    expect(mock.ledger.snapshot().unexpected).toHaveLength(1)
  })
})
