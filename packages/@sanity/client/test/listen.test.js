/* eslint-disable strict */
// (Node 4 compat)

'use strict'

const test = require('tape')
const assign = require('xtend')
const sanityClient = require('../src/sanityClient')
const sseServer = require('./helpers/sseServer')

const getClient = (options) =>
  sanityClient(
    assign(
      {
        dataset: 'prod',
        namespace: 'beerns',
        apiHost: `http://localhost:${options.port}`,
        useProjectHostname: false,
        useCdn: false,
      },
      options
    )
  )

const testSse = (onRequest, options) =>
  new Promise((resolve, reject) => {
    sseServer(onRequest, (err, server) => {
      if (err) {
        return reject(err)
      }

      const client = getClient(assign({port: server.address().port}, options))
      return resolve({server, client})
    })
  })

/*****************
 * LISTENER      *
 *****************/
test('[listener] can listen for mutations', (t) => {
  const eventData = {
    documentId: 'beer-123',
    eventId: 'blah#beer-123',
    identity: 'uid',
    mutations: [{patch: {id: 'beer-123', set: {abv: 8}}}],
    previousRev: 'MOmofa',
    result: {
      _id: 'beer-123',
      _type: 'beer',
      brewery: 'Trillium',
      title: 'Headroom Double IPA',
      abv: 8,
    },
    resultRev: 'Blatti',
    timestamp: '2017-03-29T12:36:20.506516Z',
    transactionId: 'foo',
    transition: 'update',
  }

  testSse(({request, channel}) => {
    t.equal(
      request.url,
      [
        '/v1/data/listen/prod',
        '?query=*%5Bis%20%22beer%22%20%26%26%20title%20%3D%3D%20%24beerName%5D',
        '&%24beerName=%22Headroom%20Double%20IPA%22&includeResult=true',
      ].join(''),
      'url should be correct'
    )

    channel.send({event: 'mutation', data: eventData})
    process.nextTick(() => channel.close())
  })
    .then(({server, client}) => {
      const query = '*[is "beer" && title == $beerName]'
      const params = {beerName: 'Headroom Double IPA'}

      const subscription = client.listen(query, params).subscribe({
        next: (msg) => {
          t.deepEqual(
            msg,
            assign({}, eventData, {type: 'mutation'}),
            'event data should be correct'
          )
          subscription.unsubscribe()
          server.close()
          t.end()
        },
        error: (err) => {
          subscription.unsubscribe()
          server.close()
          t.end(err)
        },
      })
    })
    .catch(t.end)
})

test('[listener] listener sends auth token if given (node)', (t) => {
  let httpServer = null
  testSse(
    ({request, channel}) => {
      t.equal(request.headers.authorization, 'Bearer foobar', 'should send token')
      channel.send({event: 'disconnect'})
      process.nextTick(() => {
        channel.close()
        httpServer.close()
        t.end()
      })
    },
    {token: 'foobar'}
  )
    .then(({server, client}) => {
      httpServer = server
      const subscription = client.listen('*').subscribe({
        error: (err) => {
          subscription.unsubscribe()
          server.close()
          t.end(err)
        },
      })
    })
    .catch(t.end)
})

test('[listener] reconnects if disconnected', (t) => {
  testSse(({request, channel}) => {
    channel.send({event: 'welcome'})
    channel.close()
    process.nextTick(() => channel.close())
  })
    .then(({server, client}) => {
      const subscription = client.listen('*', {}, {events: ['reconnect']}).subscribe({
        next: (msg) => {
          t.equal(msg.type, 'reconnect', 'emits reconnect events if told to')
          subscription.unsubscribe()
          server.close()
          t.end()
        },
        error: (err) => {
          subscription.unsubscribe()
          server.close()
          t.end(err)
        },
      })
    })
    .catch(t.end)
})

test('[listener] emits channel errors', (t) => {
  testSse(({request, channel}) => {
    channel.send({event: 'channelError', data: {message: 'Unfortunate error'}})
    channel.close()
    process.nextTick(() => channel.close())
  })
    .then(({server, client}) => {
      const subscription = client.listen('*').subscribe({
        error: (err) => {
          t.equal(err.message, 'Unfortunate error', 'should have passed error message')
          subscription.unsubscribe()
          server.close()
          t.end()
        },
      })
    })
    .catch(t.end)
})

test('[listener] emits channel errors with deep error description', (t) => {
  testSse(({request, channel}) => {
    channel.send({event: 'channelError', data: {error: {description: 'Expected error'}}})
    channel.close()
    process.nextTick(() => channel.close())
  })
    .then(({server, client}) => {
      const subscription = client.listen('*').subscribe({
        error: (err) => {
          t.equal(err.message, 'Expected error', 'should have passed error message')
          subscription.unsubscribe()
          server.close()
          t.end()
        },
      })
    })
    .catch(t.end)
})
