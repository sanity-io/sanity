import {type SanityClient} from '@sanity/client'
import {useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {EMPTY, map, type Observable} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getDraftId,
  getPublishedId,
  getVersionId,
  isSystemBundle,
  type PublishedId,
  useClient,
  usePerspective,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {
  DIFF_SEARCH_PARAM_SEPERATOR,
  DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_SEARCH_PARAMETER,
} from '../constants'
import {type DiffViewMode, diffViewModes} from '../types/diffViewMode'
import {useDiffViewRouter} from './useDiffViewRouter'

function isDiffViewMode(maybeDiffViewMode: unknown): maybeDiffViewMode is DiffViewMode {
  return diffViewModes.includes(maybeDiffViewMode as DiffViewMode)
}

type DiffViewState =
  | {
      isActive: true
      state: 'ready'
      mode: DiffViewMode
      documents: Record<
        'previous' | 'next',
        {
          type: string
          id: string
        }
      >
    }
  | {
      isActive: true
      state: 'pending' | 'error'
      mode: DiffViewMode
      documents?: never
    }
  | {
      isActive: false
      state?: never
      mode?: never
      documents?: never
    }

export function useDiffViewState(): DiffViewState {
  const {state: routerState} = useRouter()
  const searchParams = new URLSearchParams(routerState._searchParams)
  const diffViewMode = searchParams.get(DIFF_VIEW_SEARCH_PARAMETER)
  const {navigateDiffView} = useDiffViewRouter()
  const {perspectiveStack} = usePerspective()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  // TODO: Validate parameters.
  // - Ensure not `""`.
  // - Ensure not `null`.
  // - Ensure types are present in schema.
  const [previousDocumentType, previousDocumentId] = (
    searchParams.get(DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER) ?? ''
  ).split(DIFF_SEARCH_PARAM_SEPERATOR)

  const [nextDocumentType, nextDocumentId] = (
    searchParams.get(DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER) ?? ''
  ).split(DIFF_SEARCH_PARAM_SEPERATOR)

  // When in version comparison mode and no previous document is specified, the previous document
  // will be inferred by finding the next existing document in the perspective stack.
  const shouldInferPreviousDocument =
    diffViewMode === 'version' &&
    searchParams.get(DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER) === null

  const inferPreviousDocument = useMemo(() => {
    if (!shouldInferPreviousDocument) {
      return EMPTY
    }

    return findPrecedingVersion({
      bundles: perspectiveStack,
      publishedId: getPublishedId(nextDocumentId),
      client,
    })
  }, [client, perspectiveStack, nextDocumentId, shouldInferPreviousDocument])

  const inferredPreviousDocumentId = useObservable(inferPreviousDocument)

  useEffect(() => {
    if (typeof inferredPreviousDocumentId === 'undefined') {
      return
    }

    // TODO: Navigating like this once the previous document has been inferred causes a redundant
    // browser history entry to be created, resulting in an unusual experience when navigating back.
    navigateDiffView({
      mode: 'version',
      previousDocument: {
        type: nextDocumentType,
        id: inferredPreviousDocumentId,
      },
    })
  }, [inferredPreviousDocumentId, navigateDiffView, nextDocumentId, nextDocumentType])

  if (!isDiffViewMode(diffViewMode)) {
    // TODO: Improve handling.
    if (typeof diffViewMode === 'string') {
      console.warn(`Not a valid diff view: "${diffViewMode}".`)
    }
    return {
      isActive: false,
    }
  }

  if (shouldInferPreviousDocument) {
    return {
      isActive: true,
      mode: diffViewMode,
      state: 'pending',
    }
  }

  return {
    state: 'ready',
    isActive: true,
    mode: diffViewMode,
    documents: {
      previous: {
        type: previousDocumentType,
        id: previousDocumentId,
      },
      next: {
        type: nextDocumentType,
        id: nextDocumentId,
      },
    },
  }
}

/**
 * Find the first existing document id that precedes the first entry in the provided array of
 * bundles.
 *
 * This function implicitly includes draft and published documents.
 */
function findPrecedingVersion({
  bundles,
  publishedId,
  client,
}: {
  bundles: string[]
  publishedId: PublishedId
  client: SanityClient
}): Observable<string | undefined> {
  const ids = bundles
    .flatMap((bundle) => (isSystemBundle(bundle) ? [] : getVersionId(publishedId, bundle)))
    .concat(getDraftId(publishedId), publishedId)
    .slice(1)

  return client.observable
    .fetch<string | undefined>(
      '*[_id in $ids]._id',
      {
        ids,
      },
      {
        tag: 'diffView.inferPreviousDocument',
      },
    )
    .pipe(map((existentIds) => ids.find((id) => existentIds?.includes(id))))
}
