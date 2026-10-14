import {memo, startTransition, useEffect, useMemo, useState} from 'react'
import {getPublishedId, type SanityDocument, useEditState, usePerspective} from 'sanity'

import {type ConnectionStatus, type VisualEditingConnection} from '../types'

export interface PostMessageRefreshMutationsProps {
  id: string
  type: string
  comlink: VisualEditingConnection
  previewKitConnection: ConnectionStatus
  loadersConnection: ConnectionStatus
}

function PostMessageRefreshMutations(props: PostMessageRefreshMutationsProps): React.ReactNode {
  const {comlink, type, previewKitConnection, loadersConnection} = props
  const id = useMemo(() => getPublishedId(props.id), [props.id])
  const {selectedReleaseId} = usePerspective()
  const {draft, published, ready, version} = useEditState(id, type, 'low', selectedReleaseId)
  const livePreviewEnabled =
    previewKitConnection === 'connected' || loadersConnection === 'connected'

  if (!ready) {
    return null
  }

  return (
    <PostMessageRefreshMutationsInner
      // Keyed on release too, so switching perspective isn't read as a mutation
      key={`${id}:${selectedReleaseId ?? ''}`}
      comlink={comlink}
      draft={draft}
      livePreviewEnabled={livePreviewEnabled}
      published={published}
      version={version}
    />
  )
}

interface PostMessageRefreshMutationsInnerProps extends Pick<
  PostMessageRefreshMutationsProps,
  'comlink'
> {
  livePreviewEnabled: boolean
  draft: SanityDocument | null
  published: SanityDocument | null
  version: SanityDocument | null
}
function PostMessageRefreshMutationsInner(props: PostMessageRefreshMutationsInnerProps) {
  const {comlink, draft, published, livePreviewEnabled, version} = props
  const [prevDraft, setPrevDraft] = useState(draft)
  const [prevPublished, setPrevPublished] = useState(published)
  const [prevVersion, setPrevVersion] = useState(version)

  useEffect(() => {
    const changed: SanityDocument[] = []
    const removed: SanityDocument[] = []
    const pairs = [
      [prevVersion, version, setPrevVersion],
      [prevDraft, draft, setPrevDraft],
      [prevPublished, published, setPrevPublished],
    ] as const
    for (const [prev, next, setPrev] of pairs) {
      if (prev?._rev === next?._rev) continue
      startTransition(() => setPrev(next))
      if (next) {
        changed.push(next)
      } else if (prev) {
        removed.push(prev)
      }
    }

    // A removed document has no new revision, so refresh with its last state. Publish and delete
    // also remove documents, so only refresh for a removal when nothing else changed
    const documents = changed.length > 0 ? changed : removed.slice(0, 1)
    for (const document of documents) {
      comlink?.post('presentation/refresh', {
        source: 'mutation',
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        livePreviewEnabled,
        document: parseDocument(document),
      })
    }
  }, [
    comlink,
    draft,
    livePreviewEnabled,
    prevDraft,
    prevPublished,
    published,
    prevVersion,
    version,
  ])

  return null
}

function parseDocument(document: SanityDocument & {slug?: {current?: string | null}}): {
  _id: string
  _type: string
  _rev: string
  slug?: {current?: string | null}
} {
  const {_id, _type, _rev, slug} = document
  return {_id, _type, _rev, slug}
}

export default memo(PostMessageRefreshMutations)
