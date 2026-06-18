import {type SanityDocument} from '@sanity/client'
import {type CurrentUser, isValidationErrorMarker, type Schema} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, from, type Observable, of} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {
  catchError,
  delay,
  filter,
  finalize,
  map,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators'

import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {type DocumentPreviewStore} from '../../../preview'
import {isGoingToUnpublish} from '../../../releases/util/isGoingToUnpublish'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {useSource} from '../../../studio'
import {schedulerYield} from '../../../util/schedulerYield'
import {validateDocumentWithReferences} from '../../../validation'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../store/constants'
import {type DocumentInVariant, type DocumentValidationStatus} from './types'
import {toVariantDocumentVersion} from './variantDocumentVersion'

const variantDocumentsCache: Record<string, VariantDocumentsObservableResult> = Object.create(null)

/** @internal */
export function resetVariantDocumentsCacheForTests(): void {
  for (const key of Object.keys(variantDocumentsCache)) {
    delete variantDocumentsCache[key]
  }
}

type VariantDocumentsObservableResult = Observable<{
  loading: boolean
  results: DocumentInVariant[]
  error: Error | null
}>

// TODO: replace with sanity::partOfVariant($variantId) when the native GROQ function ships
const VARIANT_DOCUMENTS_GROQ_FILTER = '_system.variant._ref == $variantId'

const getVariantDocumentsObservable = ({
  documentPreviewStore,
  variantId,
  schema,
  i18n,
  getClient,
  currentUser,
}: {
  documentPreviewStore: DocumentPreviewStore
  variantId: string
  schema: Schema
  i18n: LocaleSource
  getClient: ReturnType<typeof useSource>['getClient']
  currentUser?: Omit<CurrentUser, 'role'> | null
}): VariantDocumentsObservableResult => {
  const createValidationObservable = (
    ctx: Parameters<typeof validateDocumentWithReferences>[0],
    document: SanityDocument,
  ) => {
    if (isGoingToUnpublish(document)) {
      return of({
        isValidating: false,
        validation: [],
        revision: document._rev,
        hasError: false,
      } satisfies DocumentValidationStatus)
    }

    return from(schedulerYield(() => Promise.resolve())).pipe(
      switchMap(() =>
        validateDocumentWithReferences(ctx, of(document), false).pipe(
          map((validationStatus) => ({
            ...validationStatus,
            hasError: validationStatus.validation.some((marker) => isValidationErrorMarker(marker)),
          })),
        ),
      ),
    )
  }

  const processDocument = (id: string) => {
    const ctx = {
      observeDocument: documentPreviewStore.unstable_observeDocument,
      observeDocumentPairAvailability:
        documentPreviewStore.unstable_observeDocumentPairAvailability,
      i18n,
      getClient,
      schema,
      currentUser,
    }

    const document$ = documentPreviewStore
      .unstable_observeDocument(id, {
        apiVersion: VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion,
      })
      .pipe(filter(Boolean))

    const validation$ = document$.pipe(
      switchMap((document) => createValidationObservable(ctx, document)),
    )

    return combineLatest([document$, validation$]).pipe(
      map(([document, validation]) => {
        const version = toVariantDocumentVersion(document as SanityDocument)

        if (!version) {
          return null
        }

        return {
          document: document as SanityDocument,
          version,
          validation,
          memoKey: uuid(),
        } satisfies DocumentInVariant
      }),
      filter((result): result is DocumentInVariant => result !== null),
    )
  }

  const processDocumentIdsGroup = (documentIdsGroup: string[], groupIndex: number) => {
    const batchDelay = groupIndex === 0 ? 0 : 100

    return of(documentIdsGroup).pipe(
      delay(batchDelay),
      mergeMapArray((documentId: string) => processDocument(documentId)),
    )
  }

  return documentPreviewStore
    .unstable_observeDocumentIdSet(
      VARIANT_DOCUMENTS_GROQ_FILTER,
      {variantId},
      {
        apiVersion: VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion,
      },
    )
    .pipe(
      map((state) => state.documentIds || []),
      switchMap((documentIds) => {
        if (documentIds.length === 0) {
          return of([])
        }

        const batchSize = 5
        const documentIdsGroups = []

        for (let i = 0; i < documentIds.length; i += batchSize) {
          documentIdsGroups.push(documentIds.slice(i, i + batchSize))
        }

        return combineLatest(
          documentIdsGroups.map((batch, batchIndex) =>
            processDocumentIdsGroup(batch, batchIndex).pipe(delay(batchIndex * 100)),
          ),
        ).pipe(map((groupResults) => groupResults.flat()))
      }),
      map((results) => ({loading: false, results, error: null})),
      catchError((error) => of({loading: false, results: [], error})),
    )
}

const getOrCreateVariantDocumentsObservable = ({
  documentPreviewStore,
  variantId,
  schema,
  i18n,
  getClient,
  currentUser,
}: {
  documentPreviewStore: DocumentPreviewStore
  variantId: string
  schema: Schema
  i18n: LocaleSource
  getClient: ReturnType<typeof useSource>['getClient']
  currentUser?: Omit<CurrentUser, 'role'> | null
}): VariantDocumentsObservableResult => {
  if (!variantDocumentsCache[variantId]) {
    variantDocumentsCache[variantId] = getVariantDocumentsObservable({
      documentPreviewStore,
      variantId,
      schema,
      i18n,
      getClient,
      currentUser,
    }).pipe(
      finalize(() => {
        delete variantDocumentsCache[variantId]
      }),
      shareReplay(1),
    )
  }

  return variantDocumentsCache[variantId]
}

/**
 * @internal
 */
export function useVariantDocuments(variantId: string | undefined): {
  loading: boolean
  results: DocumentInVariant[]
  error: Error | null
} {
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n, currentUser} = useSource()
  const schema = useSchema()

  const variantDocumentsObservable = useMemo(() => {
    if (!variantId) {
      return of({loading: false, results: [], error: null})
    }

    return getOrCreateVariantDocumentsObservable({
      documentPreviewStore,
      variantId,
      schema,
      i18n,
      getClient,
      currentUser,
    }).pipe(startWith({loading: true, results: [], error: null}))
  }, [currentUser, documentPreviewStore, getClient, i18n, schema, variantId])

  return useObservable(variantDocumentsObservable, {
    loading: Boolean(variantId),
    results: [],
    error: null,
  })
}
