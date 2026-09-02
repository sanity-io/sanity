import {act, renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {
  type Operation,
  type OperationCallOutcome,
} from '../../store/document/document-pair/operations/types'
import {useAsyncOperation} from '../useAsyncOperation'

function createControlledOperation() {
  let settle!: (outcome: OperationCallOutcome) => void
  const operation: Operation<[revision: string]> = {
    disabled: false,
    execute: () =>
      new Promise<OperationCallOutcome>((resolve) => {
        settle = resolve
      }),
  }
  return {operation, settle: (outcome: OperationCallOutcome) => settle(outcome)}
}

describe('useAsyncOperation', () => {
  it('tracks pending state across the call and resolves with the outcome', async () => {
    const {operation, settle} = createControlledOperation()
    const {result} = renderHook(() => useAsyncOperation(operation))

    expect(result.current.isPending).toBe(false)

    let outcome: Promise<OperationCallOutcome>
    act(() => {
      outcome = result.current.execute('rev-1')
    })

    await waitFor(() => expect(result.current.isPending).toBe(true))

    act(() => settle({type: 'success'}))

    await expect(outcome!).resolves.toEqual({type: 'success'})
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('exposes the error of a failed call and clears it on the next call', async () => {
    const first = createControlledOperation()
    const {result} = renderHook(() => useAsyncOperation(first.operation))

    let outcome: Promise<OperationCallOutcome>
    act(() => {
      outcome = result.current.execute('rev-1')
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))
    act(() => first.settle({type: 'error', error: new Error('restore failed')}))

    await expect(outcome!).resolves.toEqual({
      type: 'error',
      error: new Error('restore failed'),
    })
    await waitFor(() => expect(result.current.error).toEqual(new Error('restore failed')))
    expect(result.current.isPending).toBe(false)

    act(() => {
      void result.current.execute('rev-2')
    })
    await waitFor(() => expect(result.current.error).toBeNull())

    // Settle the second call so no transition is left pending across tests.
    act(() => first.settle({type: 'success'}))
    await waitFor(() => expect(result.current.isPending).toBe(false))
  })

  it('does not surface an error for cancelled calls', async () => {
    const {operation, settle} = createControlledOperation()
    const {result} = renderHook(() => useAsyncOperation(operation))

    let outcome: Promise<OperationCallOutcome>
    act(() => {
      outcome = result.current.execute('rev-1')
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))
    act(() => settle({type: 'cancelled'}))

    await expect(outcome!).resolves.toEqual({type: 'cancelled'})
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.error).toBeNull()
  })
})
