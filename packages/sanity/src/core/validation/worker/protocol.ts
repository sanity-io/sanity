import {type CurrentUser, type SanityDocument} from '@sanity/types'
import {type DocumentValidationResult} from '@sanity/validation'

/**
 * Locale resources for the `validation` namespace, keyed by locale id, so the worker can
 * produce the same messages as the main thread.
 */
export interface WorkerI18nResources {
  locale: string
  resources: Record<string, Record<string, string>>
}

/** Messages the main thread sends to the worker. */
export type ValidationWorkerRequest =
  | {
      type: 'init'
      requestId: number
      /** Manifest schema types, the serializable projection of the studio schema. */
      schema: {name: string; types: unknown[]}
      i18n: WorkerI18nResources
    }
  | {
      type: 'validate'
      requestId: number
      document: SanityDocument
      currentUser: Omit<CurrentUser, 'role'> | null | undefined
    }
  | {type: 'cancel'; requestId: number}
  | {type: 'rpcResult'; callId: number; value: unknown}
  | {type: 'rpcError'; callId: number; message: string}

/** Calls the worker forwards to the main thread, attributed to the validation run making them. */
export type ValidationWorkerCall =
  | {method: 'getDocumentExists'; args: {id: string}}
  | {method: 'fetch'; args: {apiVersion: string; query: string; params: unknown; tag?: string}}

/** Messages the worker sends to the main thread. */
export type ValidationWorkerResponse =
  | {type: 'ready'; requestId: number}
  | {type: 'result'; requestId: number; result: DocumentValidationResult}
  | {type: 'error'; requestId: number; message: string}
  | ({type: 'rpc'; requestId: number; callId: number} & ValidationWorkerCall)

/** The subset of `Worker` / `MessagePort` / `DedicatedWorkerGlobalScope` both sides use. */
export interface MessagePortLike<TIn, TOut> {
  postMessage(message: TOut): void
  addEventListener(type: 'message', listener: (event: {data: TIn}) => void): void
  removeEventListener(type: 'message', listener: (event: {data: TIn}) => void): void
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
