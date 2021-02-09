import client from 'part:@sanity/base/client'
import {Observable} from 'rxjs'
import {filter, map} from 'rxjs/operators'
import {fromSanityClient} from '@sanity/bifur-client'
import {
  FilteredResponseQueryOptions,
  ListenEvent,
  ListenOptions,
  MultipleMutationResult,
  Mutation,
  Patch,
  RawQueryResponse,
  SanityClient,
  SanityDocument,
  SingleMutationResult,
  Transaction,
  UnfilteredResponseQueryOptions,
} from '@sanity/client'

export const bifur = fromSanityClient(client)

function bifurFetch(
  query: string,
  params: Record<string, unknown> = {},
  options?: FilteredResponseQueryOptions | UnfilteredResponseQueryOptions
): Observable<RawQueryResponse<unknown> | unknown> {
  const mapResponse =
    options?.filterResponse === false
      ? (res: RawQueryResponse<unknown>) => res
      : (res: RawQueryResponse<unknown>) => res.result

  return bifur
    .request<RawQueryResponse<unknown>>('query', {apiVersion: 'v1', query, params})
    .pipe(map(mapResponse))
}
interface MutateOptions {
  visibility?: 'sync' | 'async' | 'defer'
  returnDocuments?: boolean
  returnFirst?: boolean
  transactionId?: string
}

interface BifurMutationResponse {
  results: {document: SanityDocument; id: string}[]
  transactionId: string
}

function bifurMutate(
  mutations: Mutation<any>[] | Patch | Transaction,
  options: MutateOptions = {}
): Observable<
  SingleMutationResult | MultipleMutationResult | SanityDocument<any> | SanityDocument<any>[]
> {
  const mut =
    mutations instanceof Patch || mutations instanceof Transaction
      ? mutations.serialize()
      : mutations

  const muts = Array.isArray(mut) ? mut : [mut]
  const {visibility, transactionId, returnDocuments, returnFirst} = options

  return bifur
    .request<BifurMutationResponse>('mutate', {
      apiVersion: 'v1',
      mutations: muts,
      transactionId,
      visibility,
      returnDocuments,
    })
    .pipe(
      map((res: BifurMutationResponse) => {
        const results = res.results || []
        if (options.returnDocuments) {
          return returnFirst
            ? results[0] && results[0].document
            : results.map((doc) => doc.document)
        }

        // Return a reduced subset
        return returnFirst
          ? {transactionId: res.transactionId, results, documentId: results[0].id}
          : {transactionId: res.transactionId, results, documentIds: results.map((doc) => doc.id)}
      })
    )
}

type ListenEventNames = 'mutation' | 'welcome' | 'reconnect' | 'channelError' | 'disconnect'
type BifurListenMessage = {type: ListenEventNames; message: ListenEvent<unknown>}

function bifurListen(
  query: string,
  params: Record<string, unknown> = {},
  options: ListenOptions = {}
): Observable<ListenEvent<unknown>> {
  const {includeResult, includePreviousRevision, visibility, effectFormat} = options
  const events: ListenEventNames[] = options.events || ['mutation']
  return bifur
    .request<BifurListenMessage>('listen', {
      query,
      params,
      includeResult,
      includePreviousRevision,
      visibility,
      effectFormat,
    })
    .pipe(
      filter(({type}) => events.includes(type)),
      map<BifurListenMessage, ListenEvent<unknown>>(({type, message}) => ({
        type,
        ...(message as any),
      }))
    )
}

function bifurGetDocument(documentId: string): Observable<SanityDocument | undefined> {
  return bifur
    .request<{documents?: SanityDocument[]}>('doc' as any, {documentIds: [documentId]})
    .pipe(map((evt) => evt.documents && evt.documents[0]))
}

function bifurGetDocuments(documentIds: string[]): Observable<SanityDocument[]> {
  return bifur
    .request<{documents?: SanityDocument[]}>('doc' as any, {documentIds})
    .pipe(
      map((evt) => {
        const indexed = (evt.documents || []).reduce((byId, doc) => {
          byId[doc._id] = doc
          return byId
        }, Object.create(null) as Record<string, SanityDocument>)
        return documentIds.map((id) => indexed[id] || null)
      })
    )
}

function promisify(fn) {
  return (...args) => fn(...args).toPromise()
}

client.getDocument = promisify(bifurGetDocument)
client.observable.getDocument = bifurGetDocument as SanityClient['observable']['getDocument']

client.getDocuments = promisify(bifurGetDocuments)
client.observable.getDocuments = bifurGetDocuments as SanityClient['observable']['getDocuments']

client.fetch = promisify(bifurFetch)
client.observable.fetch = bifurFetch as SanityClient['observable']['fetch']

client.mutate = promisify(bifurMutate)
client.observable.mutate = bifurMutate as SanityClient['observable']['mutate']

client.listen = bifurListen as SanityClient['observable']['listen']
client.observable.listen = bifurListen as SanityClient['observable']['listen']
