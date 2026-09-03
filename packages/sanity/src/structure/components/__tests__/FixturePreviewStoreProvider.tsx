import {type StackablePerspective} from '@sanity/client'
import {type DocumentSystem, type SanityDocument} from '@sanity/types'
import {type ReactNode, useMemo} from 'react'
import {of} from 'rxjs'
import {
  type DocumentAvailability,
  type DocumentPreviewStore,
  getPublishedId,
  type Previewable,
  type PreviewPath,
  prepareForPreview,
  useResourceCache,
} from 'sanity'
import {ResourceCacheContext} from 'sanity/_singletons'

const READABLE: DocumentAvailability = {available: true, reason: 'READABLE'}
const NOT_FOUND: DocumentAvailability = {available: false, reason: 'NOT_FOUND'}

function idOf(value: Previewable): string | undefined {
  if ('_ref' in value && typeof value._ref === 'string') return value._ref
  if ('_id' in value && typeof value._id === 'string') return value._id
  return undefined
}

function pick(document: SanityDocument, paths: (string | PreviewPath)[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const path of paths) {
    const segments = Array.isArray(path) ? path : path.split('.')
    let source: unknown = document
    let target = result
    segments.forEach((key, index) => {
      source =
        source && typeof source === 'object' ? (source as Record<string, unknown>)[key] : undefined
      if (index === segments.length - 1) {
        target[key] = source
        return
      }
      target[key] ??= {}
      target = target[key] as Record<string, unknown>
    })
  }
  return result
}

/**
 * An in-memory `DocumentPreviewStore` over a fixed set of documents. The
 * shared `TestWrapper` mock client answers every query with `null`, which the
 * real store cannot reassemble into previews, so harnesses that render
 * document previews (pane items, version badges, referring documents) swap
 * this store in instead. Perspective lookups follow the studio's layering:
 * `versions.<release>.<id>` for a release layer, `drafts.<id>` for drafts,
 * then the published document.
 */
function createFixturePreviewStore(documents: SanityDocument[]): DocumentPreviewStore {
  const byId = new Map(documents.map((document) => [document._id, document]))

  const idForLayer = (publishedId: string, layer: StackablePerspective): string =>
    layer === 'published'
      ? publishedId
      : layer === 'drafts'
        ? `drafts.${publishedId}`
        : `versions.${layer}.${publishedId}`

  const resolve = (
    id: string,
    perspective?: StackablePerspective[],
  ): SanityDocument | undefined => {
    const publishedId = getPublishedId(id)
    for (const layer of perspective ?? []) {
      const document = byId.get(idForLayer(publishedId, layer))
      if (document) return document
    }
    return byId.get(id) ?? byId.get(publishedId) ?? byId.get(`drafts.${publishedId}`)
  }

  const availability = (id: string): DocumentAvailability => (byId.has(id) ? READABLE : NOT_FOUND)

  const versionIds = (publishedId: string): string[] =>
    documents
      .map((document) => document._id)
      .filter((id) => getPublishedId(id) === publishedId)
      .sort()

  return {
    observePaths: (value, paths, _apiConfig, perspective) => {
      const id = idOf(value)
      const document = id ? resolve(id, perspective) : undefined
      return of(document ? pick(document, paths) : null)
    },
    observeForPreview: (value, type, options) => {
      const id = idOf(value)
      const document = id ? resolve(id, options?.perspective) : undefined
      return of({type, snapshot: document ? prepareForPreview(document, type) : null})
    },
    observeDocumentTypeFromId: (id) => of(resolve(id)?._type),
    observeDocumentSystemFromId: (id) => of(resolve(id)?._system as DocumentSystem | undefined),
    unstable_observeDocumentPairAvailability: (id) => {
      const publishedId = getPublishedId(id)
      return of({
        draft: availability(`drafts.${publishedId}`),
        published: availability(publishedId),
      })
    },
    unstable_observeDocumentStackAvailability: (id, perspectiveStack) =>
      of(
        perspectiveStack.map((layer) => {
          const layerId = idForLayer(getPublishedId(id), layer)
          return {id: layerId, availability: availability(layerId)}
        }),
      ),
    unstable_observePathsDocumentPair: (id, paths) => {
      const publishedId = getPublishedId(id)
      const draft = byId.get(`drafts.${publishedId}`)
      const published = byId.get(publishedId)
      return of({
        id: publishedId,
        type: (draft ?? published)?._type ?? null,
        draft: {
          availability: availability(`drafts.${publishedId}`),
          snapshot: draft ? (pick(draft, paths) as never) : undefined,
        },
        published: {
          availability: availability(publishedId),
          snapshot: published ? (pick(published, paths) as never) : undefined,
        },
      })
    },
    unstable_observeDocumentIdSet: (filter) => {
      // Enough GROQ to serve the incoming-references query: an optional
      // `references("<id>")` clause and an optional `_type == "<type>"` clause.
      const referenced = /references\("([^"]+)"\)/.exec(filter)?.[1]
      const type = /_type == "([^"]+)"/.exec(filter)?.[1]
      const documentIds = documents
        .filter((document) => !type || document._type === type)
        .filter(
          (document) => !referenced || JSON.stringify(document).includes(`"_ref":"${referenced}"`),
        )
        .map((document) => document._id)
        .sort()
      return of({status: 'connected', documentIds})
    },
    unstable_observeVersionDocumentIds: (publishedId) => of(versionIds(publishedId)),
    unstable_observeDocument: (id) => of(byId.get(id)),
    unstable_observeDocuments: (ids) => of(ids.map((id) => byId.get(id))),
  }
}

/**
 * Serves `useDocumentPreviewStore()` from a fixture store for everything
 * rendered underneath, while every other resource-cache namespace keeps
 * resolving through the enclosing `TestWrapper`. Mount inside `TestWrapper`.
 */
export function FixturePreviewStoreProvider(props: {
  documents: SanityDocument[]
  children: ReactNode
}) {
  const {documents, children} = props
  const parent = useResourceCache()
  const cache = useMemo<ReturnType<typeof useResourceCache>>(() => {
    const store = createFixturePreviewStore(documents)
    return {
      get: (options) =>
        options.namespace === 'documentPreviewStore' ? (store as never) : parent.get(options),
      set: (options) => {
        if (options.namespace !== 'documentPreviewStore') parent.set(options)
      },
    }
  }, [documents, parent])

  return <ResourceCacheContext.Provider value={cache}>{children}</ResourceCacheContext.Provider>
}
