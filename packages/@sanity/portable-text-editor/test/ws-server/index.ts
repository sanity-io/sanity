/* eslint-disable no-console */
import ipc from 'node-ipc'
import express from 'express'
import expressWS from 'express-ws'
import {Subject} from 'rxjs'
import {applyAll} from '../../src/patch/applyPatch'
import {PortableTextBlock} from '../../src'

const expressApp = express()
const {app} = expressWS(expressApp)
const messages = new Subject()

const PORT = 3001
const valueMap: Record<string, PortableTextBlock[] | undefined> = {}
const revisionMap: Record<string, string> = {}
const editorToSocket = new WeakMap<{editorId: string; testId: string}, any>()

let sockets: any = []
const sub = messages.subscribe((next: any) => {
  sockets.forEach((socket: any) => socket.send(next))
})

ipc.config.id = 'socketServer'
ipc.config.retry = 1500
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
      })
    )
  }
  s.on('close', () => {
    sockets = sockets.filter((socket: any) => socket !== s)
  })
  s.on('message', (msg: string) => {
    const data = JSON.parse(msg)
    if (data.type === 'hello') {
      editorToSocket.set({editorId: data.editorId, testId: data.testId}, s)
    }
    if (data.type === 'mutation' && testId) {
      valueMap[testId] = applyAll(valueMap[testId], data.patches)
      messages.next(
        JSON.stringify({
          type: 'value',
          value: valueMap[testId],
          testId,
          revId: revisionMap[testId],
        })
      )
      messages.next(JSON.stringify(data))
    }
  })
})
const server = app.listen(PORT)

process.on('SIGTERM', () => {
  sub.unsubscribe()
  server.close()
  ipc.server.stop()
})
