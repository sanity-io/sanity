import React from 'react'
import client from 'part:@sanity/base/client'

import {reqs} from './reqs'

const makeTxId = () =>
  Math.random()
    .toString(32)
    .substring(2)

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function prereqs() {
  client.create({
    _id: 'drafts.b15a9321-1039-493a-a134-8241f202e8de',
    _type: 'species',
    name: 'test'
  })
}

async function postMutations(suffix, delay, onSubmit) {
  return reqs.reduce(async (prev, request) => {
    await prev
    const txId = `${request.transactionId}-${suffix}`
    onSubmit({mutations: request.mutations, transactionId: txId})
    await client.mutate(request.mutations, {transactionId: txId})
    return wait(delay)
  }, Promise.resolve())
}

const PENDING = <span style={{display: 'inline-block', width: 75, color: 'red'}}>PENDING</span>
const RECEIVED = <span style={{display: 'inline-block', width: 75, color: 'green'}}>RECEIVED</span>

const LOG_STYLE = {border: '1px inset #aaa', backgroundColor: '#fff', padding: 5, minHeight: 150}

export function ListenerBugRepro() {
  const [receivedEvents, setEvents] = React.useState([])
  const [submittedMutations, setSubmitted] = React.useState([])
  const [delay, setDelay] = React.useState(1000)
  React.useEffect(() => {
    const sub = client
      .listen('*[!(_id in path("_.**"))]', {}, {events: ['welcome', 'mutation']})
      .subscribe(ev => {
        setEvents(current => current.concat(ev))
      })
    return () => {
      sub.unsubscribe()
    }
  }, [])

  const submit = React.useCallback(() => {
    const suffix = makeTxId()
    postMutations(suffix, delay, submittedTxId => {
      setSubmitted(current => current.concat(submittedTxId))
    })
  }, [delay])

  const pending = submittedMutations.filter(submitted => {
    return receivedEvents.every(received => received.transactionId !== submitted.transactionId)
  })

  return (
    <div style={{padding: 20}}>
      <div>
        <button onClick={prereqs}>Set up</button>
      </div>
      <div>
        Delay:{' '}
        <input
          type="number"
          value={delay}
          onChange={event => setDelay(Number(event.currentTarget.value))}
        />
      </div>
      <div>
        <button onClick={submit}>Run</button>
      </div>
      <h2>Submitted mutations ({submittedMutations.length})</h2>{' '}
      <div style={LOG_STYLE}>
        {submittedMutations.map(submitted => {
          return (
            <div>
              {pending.includes(submitted) ? PENDING : RECEIVED} {submitted.transactionId}
              <details style={{marginLeft: 10, display: 'inline-block'}}>
                <summary>Mutations</summary>
                <pre style={{fontSize: '0.8em'}}>{JSON.stringify(submitted.mutations, null, 2)}</pre>
              </details>
            </div>
          )
        })}
      </div>
      <h2>Received listener events ({receivedEvents.length})</h2>
      <div style={LOG_STYLE}>
        {receivedEvents.map(ev => (
          <div>
            {ev.transactionId} ({ev.type})
          </div>
        ))}
      </div>
    </div>
  )
}
