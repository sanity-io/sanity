import {
  type ClientPerspective,
  type MutationEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {type FunctionComponent, memo, useEffect} from 'react'
import {filter, firstValueFrom, merge, shareReplay} from 'rxjs'
import {
  isReleasePerspective,
  RELEASES_STUDIO_CLIENT_OPTIONS,
  useClient,
  VARIANTS_STUDIO_CLIENT_OPTIONS,
} from 'sanity'

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
    // Fetching with a variant requires the `vX` API version for now
    variant
      ? VARIANTS_STUDIO_CLIENT_OPTIONS
      : isReleasePerspective(perspective)
        ? RELEASES_STUDIO_CLIENT_OPTIONS
        : {apiVersion: API_VERSION},
  )

  useEffect(() => {
    let listenSubscription: {unsubscribe: () => void}
    let unsubscribeSnapshotWelcome: (() => void) | undefined

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
    unsubscribeSnapshotWelcome = comlink.on('visual-editing/snapshot-welcome', async () => {
      const event = await firstValueFrom(welcome)
      return {event}
    })

    const reconnect = listener.pipe(
      filter((event): event is ReconnectEvent => event.type === 'reconnect'),
    )

    const mutations = listener.pipe(
      filter((event): event is MutationEvent => event.type === 'mutation'),
    )

    listenSubscription = merge(
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
      unsubscribeSnapshotWelcome?.()
      listenSubscription.unsubscribe()
    }
  }, [client, comlink])

  useEffect(() => {
    const unsubscribe = comlink.on('visual-editing/fetch-snapshot', async (data) => {
      const snapshot = await client.getDocument(data.documentId, {
        tag: 'document.snapshots',
      })
      return {snapshot}
    })
    return () => {
      unsubscribe()
    }
  }, [client, comlink])

  useEffect(() => {
    const unsubscribe = comlink.on('visual-editing/mutate', async (data) => {
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      return client.dataRequest('mutate', data, {
        visibility: 'async',
        returnDocuments: true,
      })
    })
    return () => {
      unsubscribe()
    }
  }, [client, comlink])

  return null
}

export default memo(PostMessageDocuments)
