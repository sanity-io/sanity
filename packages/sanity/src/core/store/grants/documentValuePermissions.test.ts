import {act, renderHook} from '@testing-library/react'
import {StrictMode} from 'react'
import {Subject} from 'rxjs'
import {describe, expect, test, vi} from 'vitest'

import {useDocumentValuePermissions} from './documentValuePermissions'
import {type GrantsStore, type PermissionCheckResult} from './types'

vi.mock('../datastores', () => ({useGrantsStore: () => undefined}))

const GRANTED: PermissionCheckResult = {granted: true, reason: 'ok'}
// Deep-equal to GRANTED but a distinct reference, to exercise the isEqual bailout.
const GRANTED_COPY: PermissionCheckResult = {granted: true, reason: 'ok'}
const DENIED: PermissionCheckResult = {granted: false, reason: 'nope'}

function createControllableGrantsStore() {
  const emitters: Subject<PermissionCheckResult>[] = []
  const grantsStore: GrantsStore = {
    checkDocumentPermission() {
      const subject = new Subject<PermissionCheckResult>()
      emitters.push(subject)
      return subject.asObservable()
    },
  }
  // A fresh subscription is created per effect run, so only the latest subject is subscribed.
  const emitLatest = (value: PermissionCheckResult) =>
    act(() => emitters[emitters.length - 1].next(value))
  return {grantsStore, emitLatest}
}

describe('useDocumentValuePermissions', () => {
  test('shows loading on first evaluation until the first result arrives', () => {
    const {grantsStore, emitLatest} = createControllableGrantsStore()
    const {result} = renderHook(
      ({document}) => useDocumentValuePermissions({grantsStore, document, permission: 'update'}),
      {initialProps: {document: {_id: 'doc', _type: 'author', name: 'a'}}},
    )

    expect(result.current).toEqual([undefined, true])

    emitLatest(GRANTED)

    expect(result.current).toEqual([GRANTED, false])
  })

  test('re-evaluating on a document change does not flip loading back on', () => {
    const {grantsStore, emitLatest} = createControllableGrantsStore()
    const {result, rerender} = renderHook(
      ({document}) => useDocumentValuePermissions({grantsStore, document, permission: 'update'}),
      {initialProps: {document: {_id: 'doc', _type: 'author', name: 'a'}}},
    )

    emitLatest(GRANTED)
    expect(result.current).toEqual([GRANTED, false])

    rerender({document: {_id: 'doc', _type: 'author', name: 'ab'}})

    expect(result.current).toEqual([GRANTED, false])
  })

  // The fix relies on a ref surviving StrictMode's mount→unmount→remount double-invoke.
  test('does not flip loading back on under StrictMode', () => {
    const {grantsStore, emitLatest} = createControllableGrantsStore()
    const {result, rerender} = renderHook(
      ({document}) => useDocumentValuePermissions({grantsStore, document, permission: 'update'}),
      {wrapper: StrictMode, initialProps: {document: {_id: 'doc', _type: 'author', name: 'a'}}},
    )

    emitLatest(GRANTED)
    expect(result.current).toEqual([GRANTED, false])

    rerender({document: {_id: 'doc', _type: 'author', name: 'ab'}})

    expect(result.current).toEqual([GRANTED, false])
  })

  test('bails out (stable state reference) when the re-evaluated result is unchanged', () => {
    const {grantsStore, emitLatest} = createControllableGrantsStore()
    const {result, rerender} = renderHook(
      ({document}) => useDocumentValuePermissions({grantsStore, document, permission: 'update'}),
      {initialProps: {document: {_id: 'doc', _type: 'author', name: 'a'}}},
    )

    emitLatest(GRANTED)
    const settledState = result.current

    rerender({document: {_id: 'doc', _type: 'author', name: 'ab'}})
    emitLatest(GRANTED_COPY)

    expect(result.current).toBe(settledState)
  })

  test('updates when a re-evaluated result genuinely changes', () => {
    const {grantsStore, emitLatest} = createControllableGrantsStore()
    const {result, rerender} = renderHook(
      ({document}) => useDocumentValuePermissions({grantsStore, document, permission: 'update'}),
      {initialProps: {document: {_id: 'doc', _type: 'author', name: 'a'}}},
    )

    emitLatest(GRANTED)
    expect(result.current).toEqual([GRANTED, false])

    rerender({document: {_id: 'doc', _type: 'author', name: 'ab'}})
    emitLatest(DENIED)

    expect(result.current).toEqual([DENIED, false])
  })
})
