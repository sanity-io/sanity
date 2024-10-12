import {createClient, type SanityClient} from '@sanity/client'
import EventSource from '@sanity/eventsource'
import {mergeMap, share, timer} from 'rxjs'

import {connectEventSource} from './eventsource'

export type LiveApiEvent =
  | {type: 'message'; id: string; tags: string[]}
  | {type: 'restart'; id: string}
  | {type: 'open'}
  | {type: 'welcome'}
  | {type: 'reconnect'}

export interface LiveClientConfig {
  projectId: string
  dataset: string
}

export function observeLiveEvents(configOrClient: LiveClientConfig) {
  return _createLiveEventsFromClient(
    createClient({...configOrClient, apiVersion: 'vX', withCredentials: true}),
  )
}

export function liveClientConfigFromClient(client: SanityClient): LiveClientConfig {
  const {dataset, projectId} = client.config()
  if (dataset === undefined) {
    throw new Error('Dataset is required')
  }
  if (projectId === undefined) {
    throw new Error('Dataset is required')
  }
  return {dataset, projectId}
}

function _createLiveEventsFromClient(client: SanityClient) {
  const path = client.getDataUrl('live/events')
  const url = `${client.getUrl(path, false)}?includeDrafts=true`

  return connectEventSource(
    // @ts-expect-error - todo: fixme
    () => new EventSource(url.toString(), {withCredentials: true}),
    ['restart', 'message', 'welcome', 'reconnect'],
  ).pipe(
    mergeMap((event): LiveApiEvent[] => {
      if (event.type === 'message') {
        return [
          {
            type: 'message',
            id: event.id,
            tags: (event.data as any).tags as string[],
          } as const,
        ]
      }
      if (event.type === 'restart') {
        return [{type: 'restart', id: event.id} as const]
      }
      if (event.type === 'welcome') {
        // Note: welcome event is currently not properly sent, so this will never happen
        return [event as {type: 'welcome'}]
      }
      if (event.type === 'reconnect') {
        return [event as {type: 'reconnect'}]
      }
      // eslint-disable-next-line no-console
      console.error(`Ignoring unexpected event: ${event.type}`)
      return []
    }),
    share({
      resetOnError: true,
      resetOnComplete: true,
      resetOnRefCountZero: () => timer(10_000),
    }),
  )
}
