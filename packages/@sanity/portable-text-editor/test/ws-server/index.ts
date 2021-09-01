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

ipc.config.id = 'socketServer'
ipc.config.retry = 1500
ipc.config.silent = true

ipc.serveNet(() => {
  ipc.server.on('ws-payload', (message) => {
    const data = JSON.parse(message)
    if (data.type === 'value') {
      valueMap[data.testSuiteId] = data.value
    }
    messages.next(message)
  })
})
ipc.server.start()

let sockets: any = []

const sub = messages.subscribe((next: any) => {
  sockets.forEach((socket: any) => socket.send(next))
})

app.ws('/', (s, req) => {
  const testSuiteId = req.query.testSuiteId?.toString()
  if (testSuiteId && !sockets.includes(s)) {
    sockets.push(s)
    s.send(JSON.stringify({type: 'value', value: valueMap[testSuiteId], testSuiteId}))
  }
  s.on('close', () => {
    sockets = sockets.filter((socket: any) => socket !== s)
  })
  s.on('message', (msg: string) => {
    const parsed = JSON.parse(msg)
    if (parsed.type === 'mutation' && testSuiteId) {
      valueMap[testSuiteId] = applyAll(valueMap[testSuiteId], parsed.patches)
      messages.next(JSON.stringify({type: 'value', value: valueMap[testSuiteId], testSuiteId}))
      messages.next(JSON.stringify(parsed))
    }
  })
})
const server = app.listen(PORT, () =>
  console.log('\n\nWebsocket server started on http://localhost:3001/\n')
)
process.on('SIGTERM', () => {
  ipc.server.stop()
  server.close()
  sub.unsubscribe()
  console.log('\n\nWebsocket server stopped.\n')
})
