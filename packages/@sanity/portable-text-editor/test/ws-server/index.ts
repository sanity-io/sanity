import ipc from 'node-ipc'
import express from 'express'
import expressWS from 'express-ws'
import {Subject} from 'rxjs'
import type {WebSocket} from 'ws'
import {PortableTextBlock} from '@sanity/types'
import {applyAll} from '../../src/patch/applyPatch'
import {Patch} from '../../src'

const expressApp = express()
const {app} = expressWS(expressApp)
const messages: Subject<string> = new Subject()

const PORT = 3001
const valueMap: Record<string, {snapshot: PortableTextBlock[] | undefined}> = {}
const revisionMap: Record<string, string> = {}
const editorToSocket: Record<string, WebSocket> = {}
const sockets: WebSocket[] = []

const sub = messages.subscribe((next) => {
  sockets.forEach((socket) => {
    const data = JSON.parse(next)
    if (data.type === 'mutation') {
      const isOriginator = editorToSocket[data.editorId] === socket
      const patches = data.patches.map((p: Patch) => ({
        ...p,
        origin: isOriginator ? 'local' : 'remote',
      }))
      const newData = JSON.stringify({
        ...data,
        patches,
        snapshot: data.snapshot,
      })
      socket.send(newData)
      return
    }
    socket.send(next)
  })
})

ipc.config.id = 'socketServer'
ipc.config.retry = 5000
ipc.config.networkPort = 3002
ipc.config.silent = true

ipc.serveNet(() => {
  ipc.server.on('payload', (message) => {
    const data = JSON.parse(message)
    if (data.type === 'value') {
      valueMap[data.testId] = data.value
    }
    if (data.type === 'revId') {
      revisionMap[data.testId] = data.revId
    }
    messages.next(message)
  })
})
ipc.server.start()

app.ws('/', (s, req) => {
  const testId = req.query.testId?.toString()
  if (testId && !sockets.includes(s)) {
    sockets.push(s)
    s.send(
      JSON.stringify({
        type: 'value',
        value: valueMap[testId],
        testId,
        revId: revisionMap[testId] || 'first',
      }),
    )
  }
  s.on('close', () => {
    const index = sockets.findIndex((socket) => socket === s)
    if (index > -1) {
      sockets.splice(index, 1)
    }
  })
  s.on('message', (msg: string) => {
    const data = JSON.parse(msg)
    if (data.type === 'hello' && data.editorId) {
      editorToSocket[data.editorId] = s
    }
    if (data.type === 'mutation' && testId) {
      const prevValue = valueMap[testId]
      try {
        valueMap[testId] = applyAll(prevValue, data.patches)
        messages.next(
          JSON.stringify({
            ...data,
            snapshot: valueMap[testId],
          }),
        )
        messages.next(
          JSON.stringify({
            type: 'value',
            value: valueMap[testId],
            testId,
            revId: revisionMap[testId],
          }),
        )
      } catch (err) {
        console.error(err)
        // Nothing
      }
    }
  })
})
const server = app.listen(PORT)

process.on('SIGTERM', () => {
  sub.unsubscribe()
  server.close()
  ipc.server.stop()
})
