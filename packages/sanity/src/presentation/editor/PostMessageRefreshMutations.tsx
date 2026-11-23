import {memo, startTransition, useEffect, useMemo, useState} from 'react'
import {
  getDefaultVariant,
  getPublishedId,
  getTargetScopeId,
  type SanityDocument,
  type TargetDocumentState,
  useEditState,
  usePerspective,
  useTargetDocumentState,
} from 'sanity'

import {type ConnectionStatus, type VisualEditingConnection} from '../types'

export interface PostMessageRefreshMutationsProps {
  id: string
  type: string
  comlink: VisualEditingConnection
  previewKitConnection: ConnectionStatus
  loadersConnection: ConnectionStatus
}

/**
 * Variant documents live in the version slot under an opaque scope id, so they are only
 * reachable through the resolved target. The variant-of-published sibling is in no pair slot
 * of the edited target, and is watched separately so publishing a variant refreshes too.
 */
function getVariantPublishedScopeId(state: TargetDocumentState): string | undefined {
  if (state.status === 'ready' || state.status === 'variant-missing') {
    return state.siblings.published?._system.scopeId
  }
  return undefined
}

function PostMessageRefreshMutations(props: PostMessageRefreshMutationsProps): React.ReactNode {
  const {comlink, type, previewKitConnection, loadersConnection} = props
  const id = useMemo(() => getPublishedId(props.id), [props.id])
  const {selectedReleaseId, selectedVariantNames} = usePerspective()
  const isVariantSelected = getDefaultVariant(selectedVariantNames) !== undefined
  const targetDocumentState = useTargetDocumentState(id)
  const scopeId = isVariantSelected ? getTargetScopeId(targetDocumentState) : selectedReleaseId
  const variantPublishedScopeId = isVariantSelected
    ? getVariantPublishedScopeId(targetDocumentState)
    : undefined
  const {draft, published, ready, version} = useEditState(id, type, 'low', scopeId)
  const variantPublishedEditState = useEditState(id, type, 'low', variantPublishedScopeId)
  const variantPublished =
    variantPublishedScopeId && variantPublishedScopeId !== scopeId
      ? variantPublishedEditState.version
      : null
  const livePreviewEnabled =
    previewKitConnection === 'connected' || loadersConnection === 'connected'

  if (isVariantSelected && targetDocumentState.status === 'resolving') {
    return null
  }

  if ((ready && (draft || version)) || published || variantPublished) {
    return (
      <PostMessageRefreshMutationsInner
        key={id}
        comlink={comlink}
        draft={draft}
        livePreviewEnabled={livePreviewEnabled}
        published={published}
        version={version}
        variantPublished={variantPublished}
      />
    )
  }

  return null
}

interface PostMessageRefreshMutationsInnerProps extends Pick<
  PostMessageRefreshMutationsProps,
  'comlink'
> {
  livePreviewEnabled: boolean
  draft: SanityDocument | null
  published: SanityDocument | null
  version: SanityDocument | null
  variantPublished: SanityDocument | null
}
function PostMessageRefreshMutationsInner(props: PostMessageRefreshMutationsInnerProps) {
  const {comlink, draft, published, livePreviewEnabled, version, variantPublished} = props
  const [prevDraft, setPrevDraft] = useState(draft)
  const [prevPublished, setPrevPublished] = useState(published)
  const [prevVersion, setPrevVersion] = useState(version)
  const [prevVariantPublished, setPrevVariantPublished] = useState(variantPublished)

  useEffect(() => {
    if (prevVersion?._rev !== version?._rev) {
      startTransition(() => setPrevVersion(version))
      if (version) {
        comlink?.post('presentation/refresh', {
          source: 'mutation',
          // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
          livePreviewEnabled,
          document: parseDocument(version),
        })
      }
    }
    if (prevDraft?._rev !== draft?._rev) {
      startTransition(() => setPrevDraft(draft))
      if (draft) {
        comlink?.post('presentation/refresh', {
          source: 'mutation',
          // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
          // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
          livePreviewEnabled,
          document: parseDocument(published),
        })
      }
    }
    if (prevVariantPublished?._rev !== variantPublished?._rev) {
      startTransition(() => setPrevVariantPublished(variantPublished))
      if (variantPublished) {
        comlink?.post('presentation/refresh', {
          source: 'mutation',
          // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
          livePreviewEnabled,
          document: parseDocument(variantPublished),
        })
      }
    }
  }, [
    comlink,
    draft,
    livePreviewEnabled,
    prevDraft?._rev,
    prevPublished?._rev,
    published,
    prevVersion?._rev,
    version,
    prevVariantPublished?._rev,
    variantPublished,
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
