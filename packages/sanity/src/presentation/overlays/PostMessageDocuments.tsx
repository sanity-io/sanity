import {
  type ClientPerspective,
  type MutationEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {type FunctionComponent, memo, useEffect} from 'react'
import {filter, first, merge, shareReplay} from 'rxjs'
import {useClient} from 'sanity'

import {
  isReleasePerspective,
  pauseWhileDocumentHidden,
  RELEASES_STUDIO_CLIENT_OPTIONS,
} from '../../core/releases/util/releasesClient'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../core/variants/store/constants'
import {API_VERSION} from '../constants'
import {type VisualEditingConnection} from '../types'

interface PostMessageDocumentsProps {
  comlink: VisualEditingConnection
  perspective: ClientPerspective
  variant: string | undefined
}

const PostMessageDocuments: FunctionComponent<PostMessageDocumentsProps> = (props) => {
  const {comlink, perspective, variant} = props

  const client = useClient(
    // Fetching with a variant requires the variants API version
    variant
      ? VARIANTS_STUDIO_CLIENT_OPTIONS
      : isReleasePerspective(perspective)
        ? RELEASES_STUDIO_CLIENT_OPTIONS
        : {apiVersion: API_VERSION},
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
        // Visual editing handles a paused listener like a dropped one: `reconnect`, then the new
        // connection's `welcome`, after which it fetches its snapshots again
        pauseWhileDocumentHidden({onPause: (): ReconnectEvent => ({type: 'reconnect'})}),
        filter(
          (event): event is WelcomeEvent | ReconnectEvent | MutationEvent =>
            event.type === 'welcome' || event.type === 'reconnect' || event.type === 'mutation',
        ),
      )

    // `reconnect` replaces the replayed `welcome`, so a context that asks for it while the listener
    // is paused or reconnecting waits for the new connection instead of trusting the old one
    const connection = listener.pipe(
      filter(
        (event): event is WelcomeEvent | ReconnectEvent =>
          event.type === 'welcome' || event.type === 'reconnect',
      ),
      shareReplay({bufferSize: 1, refCount: false}),
    )

    const welcome = connection.pipe(
      filter((event): event is WelcomeEvent => event.type === 'welcome'),
    )

    // When new contexts initialize, they need to explicitly request the welcome
    // event, as we can't rely on emitting it into the void
    const unsubscribe = comlink.on('visual-editing/snapshot-welcome', async () => {
      const event = await new Promise<WelcomeEvent>((resolve) => {
        welcome.pipe(first()).subscribe((event) => {
          resolve(event)
        })
      })
      return {event}
    })

    const mutations = listener.pipe(
      filter((event): event is MutationEvent => event.type === 'mutation'),
    )

    const events = merge(
      /**
       * @deprecated post only `reconnect` here and switch to explict welcome message fetching at next major
       */
      connection,
      mutations,
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
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      return client.dataRequest('mutate', data, {
        visibility: 'async',
        returnDocuments: true,
      })
    })
  }, [client, comlink])

  return null
}

export default memo(PostMessageDocuments)
