import {createClient, type SanityClient} from '@sanity/client'
import EventSource from '@sanity/eventsource'
import {defer, mergeMap, of, share, shareReplay, timer} from 'rxjs'

import {connectEventSource} from './eventsource'

const eventSourceImpl = defer(() => {
  return of(EventSource)
}).pipe(shareReplay(1))

export type LiveApiEvent =
  | {type: 'message'; id: string; tags: string[]}
  | {type: 'restart'; id: string}
  | {type: 'open'}
  | {type: 'welcome'}
  | {type: 'reconnect'}

export interface LiveClientConfig {
  projectId: string
  includeDrafts?: boolean
  dataset: string
  apiVersion?: string
  useCdn?: boolean
}

const requiredApiVersion = 'vX'

export function observeLiveEvents(configOrClient: LiveClientConfig) {
  return _createLiveEventsFromClient(createClient(configOrClient))
}

export function liveClientConfigFromClient(client: SanityClient): LiveClientConfig {
  const {apiVersion = '2024-07-06', dataset, projectId} = client.config()
  if (apiVersion !== 'X' && apiVersion < requiredApiVersion) {
    throw new Error(
      `The live events API requires API version ${requiredApiVersion} or later. ` +
        `The current API version is ${apiVersion}. ` +
        `Please update your API version to use this feature.`,
    )
  }
  if (dataset === undefined) {
    throw new Error('Dataset is required')
  }
  if (projectId === undefined) {
    throw new Error('Dataset is required')
  }
  return {apiVersion, dataset, projectId}
}

function _createLiveEventsFromClient(client: SanityClient) {
  // todo: feels unnecessary to have to have a full client here
  //  would be better to import and use getDataUrl and getUrl separately from the client
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
      resetOnRefCountZero: () => timer(1000),
    }),
  )
}
