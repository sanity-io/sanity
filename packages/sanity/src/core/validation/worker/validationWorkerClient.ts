import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type SanityDocument} from '@sanity/types'
import {type DocumentValidationResult} from '@sanity/validation'

import {
  errorMessage,
  type MessagePortLike,
  type ValidationWorkerCall,
  type ValidationWorkerRequest,
  type ValidationWorkerResponse,
  type WorkerI18nResources,
} from './protocol'

type ClientPort = MessagePortLike<ValidationWorkerResponse, ValidationWorkerRequest> & {
  /** `Worker` fires these when the worker script fails; message ports do not. */
  addEventListener(type: 'error' | 'messageerror', listener: (event: unknown) => void): void
  terminate?: () => void
}

export interface ValidationWorkerRunOptions {
  document: SanityDocument
  currentUser: Omit<CurrentUser, 'role'> | null | undefined
  getDocumentExists: (options: {id: string}) => Promise<boolean>
  getClient: (options: {apiVersion: string}) => SanityClient
  signal?: AbortSignal
}

export interface ValidationWorkerClient {
  /**
   * Resolves once the worker has compiled the schema, with the document types it had to leave
   * out; rejects when nothing could be compiled.
   */
  ready: Promise<{unsupportedTypes: string[]}>
  validate(options: ValidationWorkerRunOptions): Promise<DocumentValidationResult>
  terminate(): void
}

interface PendingRun {
  resolve: (result: DocumentValidationResult) => void
  reject: (error: Error) => void
  options: ValidationWorkerRunOptions
}

/**
 * Main-thread side of the validation worker: sends the schema once, then one message per
 * document to validate, and answers the worker's reference and client calls.
 */
export function createValidationWorkerClient(options: {
  port: ClientPort
  schema: {name: string; types: unknown[]}
  i18n: WorkerI18nResources
}): ValidationWorkerClient {
  const {port} = options
  let nextRequestId = 1
  const runs = new Map<number, PendingRun>()
  let failure: Error | undefined

  const initRequestId = nextRequestId++
  let resolveReady: (value: {unsupportedTypes: string[]}) => void = () => undefined
  let rejectReady: (error: Error) => void = () => undefined
  const ready = new Promise<{unsupportedTypes: string[]}>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })
  // A rejected `ready` is always observed through `validate`; keep the promise itself quiet.
  ready.catch(() => undefined)

  const fail = (error: Error) => {
    failure = error
    rejectReady(error)
    for (const run of runs.values()) run.reject(error)
    runs.clear()
  }

  const answer = async (message: {requestId: number; callId: number} & ValidationWorkerCall) => {
    const run = runs.get(message.requestId)
    if (!run) return
    try {
      const value = await callMainThread(run.options, message)
      port.postMessage({type: 'rpcResult', callId: message.callId, value})
    } catch (error) {
      port.postMessage({type: 'rpcError', callId: message.callId, message: errorMessage(error)})
    }
  }

  const handleMessage = (event: {data: ValidationWorkerResponse}) => {
    const message = event.data
    switch (message.type) {
      case 'ready': {
        if (message.requestId === initRequestId) {
          resolveReady({unsupportedTypes: message.unsupportedTypes})
        }
        return
      }
      case 'result': {
        const run = runs.get(message.requestId)
        runs.delete(message.requestId)
        run?.resolve(message.result)
        return
      }
      case 'error': {
        if (message.requestId === initRequestId) {
          fail(new Error(message.message))
          return
        }
        const run = runs.get(message.requestId)
        runs.delete(message.requestId)
        run?.reject(new Error(message.message))
        return
      }
      case 'rpc': {
        void answer(message)
        return
      }
      default: {
        const unknown: never = message
        throw new Error(`Unknown validation worker response: ${JSON.stringify(unknown)}`)
      }
    }
  }

  port.addEventListener('message', handleMessage)
  port.addEventListener('error', (event) => {
    fail(
      new Error(
        `Validation worker failed: ${errorMessage(
          typeof event === 'object' && event !== null && 'message' in event
            ? (event as {message: unknown}).message
            : event,
        )}`,
      ),
    )
  })
  port.addEventListener('messageerror', () => {
    fail(new Error('Validation worker sent a message that could not be deserialized'))
  })

  port.postMessage({
    type: 'init',
    requestId: initRequestId,
    schema: options.schema,
    i18n: options.i18n,
  })

  return {
    ready,
    validate(runOptions) {
      if (failure) return Promise.reject(failure)
      const {signal} = runOptions
      if (signal?.aborted) return Promise.reject(signal.reason)
      const requestId = nextRequestId++
      return new Promise<DocumentValidationResult>((resolve, reject) => {
        const onAbort = () => {
          runs.delete(requestId)
          port.postMessage({type: 'cancel', requestId})
          reject(signal?.reason)
        }
        signal?.addEventListener('abort', onAbort, {once: true})
        const settle =
          <T>(fn: (value: T) => void) =>
          (value: T) => {
            signal?.removeEventListener('abort', onAbort)
            fn(value)
          }
        runs.set(requestId, {resolve: settle(resolve), reject: settle(reject), options: runOptions})
        port.postMessage({
          type: 'validate',
          requestId,
          document: runOptions.document,
          currentUser: runOptions.currentUser ?? null,
        })
      })
    },
    terminate() {
      fail(new Error('Validation worker was terminated'))
      port.removeEventListener('message', handleMessage)
      port.terminate?.()
    },
  }
}

function callMainThread(
  options: ValidationWorkerRunOptions,
  call: ValidationWorkerCall,
): Promise<unknown> {
  switch (call.method) {
    case 'getDocumentExists':
      return options.getDocumentExists({id: call.args.id})
    case 'fetch': {
      const {apiVersion, query, params, tag} = call.args
      return options
        .getClient({apiVersion})
        .fetch(query, params as Record<string, unknown> | undefined, tag ? {tag} : undefined)
    }
    default: {
      const unknown: never = call
      throw new Error(`Unknown validation worker call: ${JSON.stringify(unknown)}`)
    }
  }
}
