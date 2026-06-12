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
      const event = await new Promise<WelcomeEvent>((resolve, reject) => {
        // Reject on stream error so the request fails fast instead of
        // leaving the promise (and the iframe's request) pending forever.
        welcome.pipe(first()).subscribe({next: resolve, error: reject})
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
    ).subscribe({
      next: (event) => {
        comlink.post('presentation/snapshot-event', {event})
      },
      error: (err) => {
        // `client.listen` reconnects on transient drops, so this only
        // fires on fatal listener errors (e.g. auth/permission). Log it
        // instead of leaving an unhandled rxjs error — document sync
        // stops, but overlays keep working from their last snapshot.
        console.error(new Error('Presentation document listener failed', {cause: err}))
      },
    })

    return () => {
      unsubscribe()
      events.unsubscribe()
    }
  }, [client, comlink])

  useEffect(() => {
    return comlink.on('visual-editing/fetch-snapshot', async (data) => {
      try {
        const snapshot = await client.getDocument(data.documentId, {
          tag: 'document.snapshots',
        })
        return {snapshot}
      } catch (err) {
        // comlink awaits the handler without a try/catch — a rejection
        // here would be an unhandled rejection AND leave the
        // visual-editing iframe waiting forever for a response. The
        // response contract allows `undefined` (missing document).
        console.error(new Error('Failed to fetch document snapshot', {cause: err}))
        return {snapshot: undefined}
      }
    })
  }, [client, comlink])

  useEffect(() => {
    return comlink.on('visual-editing/mutate', async (data) => {
      try {
        return await client.dataRequest('mutate', data, {
          visibility: 'async',
          returnDocuments: true,
        })
      } catch (err) {
        // See above — respond with an error payload (the response
        // contract is `any`) instead of hanging the iframe's request and
        // swallowing the failed write.
        console.error(new Error('Failed to apply visual editing mutation', {cause: err}))
        return {error: err instanceof Error ? err.message : String(err)}
      }
    })
  }, [client, comlink])

  return null
}

export default memo(PostMessageDocuments)
