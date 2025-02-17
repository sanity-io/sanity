import {
  type ClientPerspective,
  type MutationEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {type FunctionComponent, memo, useEffect} from 'react'
import {filter, first, merge, shareReplay} from 'rxjs'
import {isReleasePerspective, RELEASES_STUDIO_CLIENT_OPTIONS, useClient} from 'sanity'

import {API_VERSION} from '../constants'
import {type VisualEditingConnection} from '../types'

interface PostMessageDocumentsProps {
  comlink: VisualEditingConnection
  perspective: ClientPerspective
}

const PostMessageDocuments: FunctionComponent<PostMessageDocumentsProps> = (props) => {
  const {comlink, perspective} = props

  const client = useClient(
    isReleasePerspective(perspective) ? RELEASES_STUDIO_CLIENT_OPTIONS : {apiVersion: API_VERSION},
  )

  useEffect(() => {
    const listener = client
      .listen(
        '*[!(_id in path("_.**"))]',
        {},
        {
          effectFormat: 'mendoza',
          events: ['welcome', 'mutation', 'reconnect'],
          includePreviousRevision: false,
          includeResult: false,
          includeAllVersions: true,
          tag: 'presentation-documents',
          visibility: 'transaction',
        },
      )
      .pipe(
        filter(
          (event): event is WelcomeEvent | ReconnectEvent | MutationEvent =>
            event.type === 'welcome' || event.type === 'reconnect' || event.type === 'mutation',
        ),
      )

    const welcome = listener.pipe(
      filter((event): event is WelcomeEvent => event.type === 'welcome'),
      shareReplay({bufferSize: 1, refCount: false}),
    )

    // When new contexts initialize, they need to explicitly request the welcome
    // event, as we can't rely on emitting it into the void
    const unsubscribe = comlink.on('visual-editing/snapshot-welcome', async () => {
      const event = await new Promise<WelcomeEvent>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        welcome.pipe(first()).subscribe((event) => {
          resolve(event)
        })
      })
      return {event}
    })

    const reconnect = listener.pipe(
      filter((event): event is ReconnectEvent => event.type === 'reconnect'),
    )

    const mutations = listener.pipe(
      filter((event): event is MutationEvent => event.type === 'mutation'),
    )

    const events = merge(
      /**
       * @deprecated remove 'welcome' here and switch to explict welcome message fetching at next major
       */
      welcome,
      mutations,
      reconnect,
    ).subscribe((event) => {
      comlink.post('presentation/snapshot-event', {event})
    })

    return () => {
      unsubscribe()
      events.unsubscribe()
    }
  }, [client, comlink])

  useEffect(() => {
    return comlink.on('visual-editing/fetch-snapshot', async (data) => {
      const snapshot = await client.getDocument(data.documentId, {
        tag: 'document.snapshots',
      })
      return {snapshot}
    })
  }, [client, comlink])

  useEffect(() => {
    return comlink.on('visual-editing/mutate', async (data) => {
      return client.dataRequest('mutate', data, {
        visibility: 'async',
        returnDocuments: true,
      })
    })
  }, [client, comlink])

  return null
}

export default memo(PostMessageDocuments)
