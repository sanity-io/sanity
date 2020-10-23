import test from 'tape'
import {Observable} from 'rxjs'
import PresenceStore from '../src/PresenceStore'

function assembleMock() {
  const result = {}

  result.connection = {
    send: (msg) => {
      result.lastSentMessage = msg
    },
    sendBeacon: (msg) => {
      result.lastSentBeacon = msg
    },
    listen: () => {
      return new Observable((observer) => {
        result.broadcast = (msg) => observer.next(msg)
        return () => {
          result.ubsubscribed = true
        }
      })
    },
  }

  result.store = new PresenceStore(result.connection, 'channel')
  result.store.sessionId = 'my-session-uuid'

  result.close = () => {
    result.store.close()
  }

  return result
}

test('can send a state report', (t) => {
  const mock = assembleMock()
  mock.store.reportMyState({hello: 'friends'})
  const sent = mock.lastSentMessage
  t.equal(typeof sent, 'object', 'message must be an object')
  t.equal(sent.type, 'state', 'type must be state')
  t.equal(sent.hello, 'friends', 'our payload must be there')
  mock.close()
  t.end()
})

test('correctly models states', (t) => {
  const mock = assembleMock()
  mock.broadcast({
    i: 'identity1',
    m: {
      type: 'state',
      session: 'session1',
      im: 'away',
    },
  })

  mock.broadcast({
    i: 'identity1',
    m: {
      type: 'state',
      session: 'session1',
      im: 'here',
    },
  })

  mock.broadcast({
    i: 'identity1',
    m: {
      type: 'state',
      session: 'session2',
      im: 'here too',
    },
  })

  mock.broadcast({
    i: 'identity2',
    m: {
      type: 'state',
      session: 'session1',
      im: 'over here',
    },
  })

  t.deepEqual(
    mock.store.getStateReport(),
    [
      {identity: 'identity1', session: 'session1', im: 'here'},
      {identity: 'identity1', session: 'session2', im: 'here too'},
      {identity: 'identity2', session: 'session1', im: 'over here'},
    ],
    'the state report must reflect the latest state seen'
  )

  mock.close()
  t.end()
})

test('sends debounced state reports to subscribers', (t) => {
  const mock = assembleMock()
  let initialSent = false
  mock.store.presence.subscribe((msg) => {
    if (!initialSent) {
      t.deepEqual(msg, [], 'initial state should be empty')
      initialSent = true
      return
    }
    t.deepEqual(
      msg,
      [{identity: 'identity1', session: 'session1', im: 'here'}],
      'next state should include recent information'
    )
    mock.close()
    t.end()
  })

  mock.broadcast({
    i: 'identity1',
    m: {
      type: 'state',
      session: 'session1',
      im: 'away',
    },
  })

  mock.broadcast({
    i: 'identity1',
    m: {
      type: 'state',
      session: 'session1',
      im: 'here',
    },
  })
})

test('sends initial state reports to new subscribers', (t) => {
  const mock = assembleMock()
  mock.broadcast({
    i: 'identity1',
    m: {
      type: 'state',
      session: 'session1',
      im: 'here',
    },
  })

  // Wait for the debounce to fire before subscribing
  setTimeout(() => {
    mock.store.presence.subscribe((msg) => {
      t.deepEqual(
        msg,
        [{identity: 'identity1', session: 'session1', im: 'here'}],
        'initial state should describe pre-existing state'
      )
      mock.close()
      t.end()
    })
  }, 500)
})

test('removes state for disconnected clients', (t) => {
  const mock = assembleMock()
  mock.broadcast({
    i: 'identity1',
    m: {
      type: 'state',
      session: 'session1',
      im: 'away',
    },
  })
  mock.broadcast({
    i: 'identity1',
    m: {
      type: 'disconnect',
      session: 'session1',
    },
  })
  t.deepEqual(mock.store.getStateReport(), [], 'report should be empty because client disconnected')
  mock.close()
  t.end()
})

test('sends disconnect beacon when closed', (t) => {
  const mock = assembleMock()
  mock.close()
  t.deepEqual(mock.lastSentBeacon, {
    type: 'disconnect',
    session: 'my-session-uuid',
  })
  t.end()
})
