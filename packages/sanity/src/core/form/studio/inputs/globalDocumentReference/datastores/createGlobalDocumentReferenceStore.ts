import {type SanityClient, type SanityDocument} from '@sanity/client'
import {type GlobalDocumentReferenceSchemaType} from '@sanity/types'
import uniq from 'lodash-es/uniq.js'
import {type Observable, timer} from 'rxjs'
import {filter, finalize, map, shareReplay, switchMap} from 'rxjs/operators'

import {LISTENER_RESET_DELAY} from '../../../../../preview/constants'
import {createPathObserver} from '../../../../../preview/createPathObserver'
import {debounceCollect} from '../../../../../preview/utils/debounceCollect'
import {shareReplayLatest} from '../../../../../preview/utils/shareReplayLatest'
import {type GlobalDocumentReferenceInfo} from '../../../../inputs/GlobalDocumentReferenceInput/types'
import {getReferenceClient} from './getReferenceClient'
import {createGetReferenceInfo} from './getReferenceInfo'

const REQUEST_TAG_BASE = 'gdr'

const BATCH_FETCH_WAIT = 10

type ResourceSchemaType = Pick<GlobalDocumentReferenceSchemaType, 'resourceType' | 'resourceId'>

/**
 * Previews and searches the documents that global document references point to. Every
 * referenced resource (a dataset, a media library, a canvas) gets one listener, shared by all
 * the references to it, however many fields, array items and search hits preview them.
 *
 * @internal
 */
export interface GlobalDocumentReferenceStore {
  getClient: (schemaType: ResourceSchemaType) => SanityClient
  getReferenceInfo: (
    doc: {_id: string; _type?: string},
    referenceType: GlobalDocumentReferenceSchemaType,
  ) => Observable<GlobalDocumentReferenceInfo>
}

interface ReferencedResource {
  client: SanityClient
  getReferenceInfo: GlobalDocumentReferenceStore['getReferenceInfo']
}

/** @internal */
export function createGlobalDocumentReferenceStore(context: {
  client: SanityClient
}): GlobalDocumentReferenceStore {
  const resources = new Map<string, ReferencedResource>()

  function getResource(schemaType: ResourceSchemaType): ReferencedResource {
    const key = `${schemaType.resourceType}:${schemaType.resourceId}`
    let resource = resources.get(key)
    if (!resource) {
      resource = createReferencedResource(getReferenceClient(context.client, schemaType))
      resources.set(key, resource)
    }
    return resource
  }

  return {
    getClient: (schemaType) => getResource(schemaType).client,
    getReferenceInfo: (doc, referenceType) =>
      getResource(referenceType).getReferenceInfo(doc, referenceType),
  }
}

function createReferencedResource(client: SanityClient): ReferencedResource {
  const listener$ = client.observable
    .listen(
      '*',
      {},
      {
        events: ['welcome', 'mutation'],
        includeResult: false,
        visibility: 'query',
        tag: `${REQUEST_TAG_BASE}.preview`,
      },
    )
    .pipe(
      // Late subscribers need the `welcome` that already arrived to fetch their initial value
      shareReplayLatest({
        predicate: (event) => event.type === 'welcome',
        resetOnRefCountZero: () => timer(LISTENER_RESET_DELAY),
      }),
    )

  const fetchDocument = debounceCollect(
    (collected: [id: string][]): Observable<(SanityDocument | null)[]> => {
      const ids = collected.map(([id]) => id)
      return client.observable
        .getDocuments(uniq(ids), {tag: `${REQUEST_TAG_BASE}.get-documents`})
        .pipe(
          map((documents) => {
            const byId = new Map(documents.map((document) => [document?._id, document]))
            return ids.map((id) => byId.get(id) ?? null)
          }),
        )
    },
    BATCH_FETCH_WAIT,
  )

  const documents = new Map<string, Observable<SanityDocument | null>>()

  function observeDocument(id: string): Observable<SanityDocument | null> {
    const existing = documents.get(id)
    if (existing) {
      return existing
    }
    const document$: Observable<SanityDocument | null> = listener$.pipe(
      filter(
        (event) =>
          event.type === 'welcome' || (event.type === 'mutation' && event.documentId === id),
      ),
      switchMap(() => fetchDocument(id)),
      finalize(() => {
        if (documents.get(id) === document$) {
          documents.delete(id)
        }
      }),
      shareReplay({bufferSize: 1, refCount: true}),
    )
    documents.set(id, document$)
    return document$
  }

  const observePaths = createPathObserver({observeFields: (id) => observeDocument(id)})

  return {
    client,
    getReferenceInfo: createGetReferenceInfo({client, observeDocument, observePaths}),
  }
}
