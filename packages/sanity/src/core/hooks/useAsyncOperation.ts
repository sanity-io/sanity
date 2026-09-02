import {useCallback, useState, useTransition} from 'react'

import {
  type Operation,
  type OperationCallOutcome,
} from '../store/document/document-pair/operations/types'

/**
 * An awaitable view over a document {@link Operation}, exposing React 19 action semantics:
 * a pending flag driven by a transition and the error of the most recent call.
 *
 * @hidden
 * @beta
 */
export interface AsyncOperation<
  ExtraArgs extends any[] = [],
  ErrorStrings extends string = string,
> {
  /** Mirrors {@link Operation.disabled} for the underlying operation. */
  disabled: false | ErrorStrings | 'NOT_READY'
  /**
   * Executes the operation inside a React transition and resolves with the outcome of this
   * specific call. The promise never rejects: failures resolve as `{type: 'error'}`, and calls
   * superseded by a newer operation on the same document resolve as `{type: 'cancelled'}`.
   */
  execute: (...args: ExtraArgs) => Promise<OperationCallOutcome>
  /** True from the moment `execute` is called until the outcome settles. */
  isPending: boolean
  /** The error of the most recent call, or null. Cleared when a new call starts. */
  error: Error | null
}

/**
 * Wraps a document operation (from `useDocumentOperation`) in an awaitable async action.
 *
 * Instead of firing the operation and separately watching `useDocumentOperationEvent` for a
 * matching event, callers await the outcome of their own call:
 *
 * ```ts
 * const {restore} = useDocumentOperation(id, type)
 * const restoreAsync = useAsyncOperation(restore)
 *
 * const handleConfirm = async () => {
 *   const outcome = await restoreAsync.execute(revision)
 *   if (outcome.type === 'success') navigateIntent('edit', {id, type})
 * }
 * ```
 *
 * `isPending` stays true for the full duration of the call (React 19 async transition), and
 * `error` holds the failure of the most recent call for inline error UI.
 *
 * @hidden
 * @beta
 */
export function useAsyncOperation<ExtraArgs extends any[], ErrorStrings extends string>(
  operation: Operation<ExtraArgs, ErrorStrings>,
): AsyncOperation<ExtraArgs, ErrorStrings> {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    (...args: ExtraArgs) => {
      // Cleared outside the transition: updates inside an async transition are batched until the
      // action settles, which would leave a stale error visible for the duration of the retry.
      setError(null)
      return new Promise<OperationCallOutcome>((resolve) => {
        startTransition(async () => {
          const outcome = await operation.execute(...args)
          if (outcome.type === 'error') {
            setError(outcome.error)
          }
          resolve(outcome)
        })
      })
    },
    [operation],
  )

  return {disabled: operation.disabled, execute, isPending, error}
}
