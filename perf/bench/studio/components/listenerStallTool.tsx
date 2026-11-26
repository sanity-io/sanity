import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

/**
 * Opens as many listeners as requested through the Studio client's `listen`, so they go through
 * the same counting fetch as the Studio's own listeners. Lets the listener stall session put one
 * tab over the connection's stream budget, which no stock view does.
 */
export function ListenerStallTool() {
  const client = useClient({apiVersion: '2025-02-19'})
  const [draftCount, setDraftCount] = useState('')
  const [listenerCount, setListenerCount] = useState(0)

  useEffect(() => {
    const subscriptions = Array.from({length: listenerCount}, (_unused, index) =>
      client.listen('*[_id == $id]', {id: `listener-stall-${index}`}).subscribe(),
    )
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe())
  }, [client, listenerCount])

  return (
    <div>
      <input
        data-testid="listener-stall-count"
        inputMode="numeric"
        value={draftCount}
        onChange={(event) => setDraftCount(event.currentTarget.value)}
      />
      <button
        data-testid="listener-stall-open"
        type="button"
        onClick={() => setListenerCount(Number(draftCount))}
      >
        Open listeners
      </button>
      <button data-testid="listener-stall-close" type="button" onClick={() => setListenerCount(0)}>
        Close listeners
      </button>
      <output data-testid="listener-stall-open-count">{listenerCount}</output>
    </div>
  )
}
