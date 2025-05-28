import {memo, startTransition, useEffect, useMemo, useState} from 'react'
import {getPublishedId, type SanityDocument, useEditState} from 'sanity'

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
  const {draft, published, ready} = useEditState(id, type, 'low')
  const livePreviewEnabled =
    previewKitConnection === 'connected' || loadersConnection === 'connected'

  if ((ready && draft) || published) {
    return (
      <PostMessageRefreshMutationsInner
        key={id}
        comlink={comlink}
        draft={draft}
        livePreviewEnabled={livePreviewEnabled}
        published={published}
      />
    )
  }

  return null
}

interface PostMessageRefreshMutationsInnerProps
  extends Pick<PostMessageRefreshMutationsProps, 'comlink'> {
  livePreviewEnabled: boolean
  draft: SanityDocument | null
  published: SanityDocument | null
}
function PostMessageRefreshMutationsInner(props: PostMessageRefreshMutationsInnerProps) {
  const {comlink, draft, published, livePreviewEnabled} = props
  const [prevDraft, setPrevDraft] = useState(draft)
  const [prevPublished, setPrevPublished] = useState(published)

  useEffect(() => {
    if (prevDraft?._rev !== draft?._rev) {
      startTransition(() => setPrevDraft(draft))
      if (draft) {
        comlink?.post('presentation/refresh', {
          source: 'mutation',
          livePreviewEnabled,
          document: parseDocument(draft),
        })
      }
    }
    if (prevPublished?._rev !== published?._rev) {
      startTransition(() => setPrevPublished(published))
      if (published) {
        comlink?.post('presentation/refresh', {
          source: 'mutation',
          livePreviewEnabled,
          document: parseDocument(published),
        })
      }
    }
  }, [comlink, draft, livePreviewEnabled, prevDraft?._rev, prevPublished?._rev, published])

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
