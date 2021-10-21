import {IdPair} from './types'
declare const _default: {
  checkoutPair: (idPair: IdPair) => import('./document-pair/checkoutPair').Pair
  listenQuery: (query: string, params: {}) => import('rxjs').Observable<unknown>
  pair: {
    editState: (
      publishedId: string,
      type: any
    ) => import('rxjs').Observable<import('./document-pair/editState').EditStateFor>
    editOperations: (
      publishedId: string,
      type: any
    ) => import('rxjs').Observable<import('./document-pair/operations').OperationsAPI>
    documentEvents: (
      publishedId: string,
      type: string
    ) => import('rxjs').Observable<
      | (import('./buffered-doc/types').DocumentRebaseEvent & {
          version: 'published' | 'draft'
        })
      | (import('./buffered-doc/types').DocumentMutationEvent & {
          version: 'published' | 'draft'
        })
      | (import('./buffered-doc/types').SnapshotEvent & {
          version: 'published' | 'draft'
        })
      | (import('./buffered-doc/types').CommittedEvent & {
          version: 'published' | 'draft'
        })
      | (import('./types').ReconnectEvent & {
          version: 'published' | 'draft'
        })
    >
    validation: (
      publishedId: string,
      typeName: string
    ) => import('rxjs').Observable<import('./document-pair/validation').ValidationStatus>
    operationEvents: (
      publishedId: any,
      type: any
    ) => import('rxjs').Observable<
      | import('./document-pair/operationEvents').OperationError
      | import('./document-pair/operationEvents').OperationSuccess
    >
    consistencyStatus: (publishedId: any) => import('rxjs').Observable<boolean>
  }
}
export default _default
