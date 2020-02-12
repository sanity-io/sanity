import client from 'part:@sanity/base/client'
import {Observable} from 'rxjs'

const EventSource =
  typeof window !== 'undefined' && window.EventSource
    ? window.EventSource // Native browser EventSource
    : require('@sanity/eventsource') // Node.js, IE etc

function parseData(data) {
  try {
    return (data && JSON.parse(data)) || {}
  } catch (err) {
    return err
  }
}

export interface ReflectorWelcomeEvent {
  type: 'welcome'
  data: {channel: string; project: string; identity: string}
}

export interface ReflectorMessageEvent<T> {
  type: 'message'
  data: {
    i: string
    m: T
  }
}

export function listen<T>(channel): Observable<ReflectorMessageEvent<T> | ReflectorWelcomeEvent> {
  const {token, withCredentials} = client.clientConfig

  const esOptions: any = {}
  if (token || withCredentials) {
    esOptions.withCredentials = true
  }

  if (token) {
    esOptions.headers = {
      Authorization: `Bearer ${token}`
    }
  }

  const url = client.getUrl(`presence/listen/${channel}`)
  return new Observable(observer => {
    function onMessage(event) {
      const data = parseData(event.data)
      return data instanceof Error ? observer.error(data) : observer.next({type: event.type, data})
    }

    const es = new EventSource(url, esOptions)
    es.addEventListener('message', onMessage, false)
    es.addEventListener('welcome', onMessage, false)

    function unsubscribe() {
      es.removeEventListener('message', onMessage, false)
      es.removeEventListener('welcome', onMessage, false)
      es.close()
    }

    return unsubscribe
  })
}
