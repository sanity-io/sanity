import {describe, expect, it, vi} from 'vitest'

import {createVariantPermissionsStore} from '../createVariantPermissionsStore'

const DRY_RUN_OPTIONS = {dryRun: true, skipCrossDatasetReferenceValidation: true}

type Action = (...args: unknown[]) => Promise<{transactionId: string}>

/**
 * The store keys its cache by `action.name` (the operations store hands it named handlers), so
 * mocks need a name too.
 */
function namedAction(name: string, implementation: Action) {
  return Object.defineProperty(vi.fn(implementation), 'name', {value: name})
}

function permissionError() {
  return Object.assign(new Error('Insufficient permissions'), {
    details: {
      type: 'mutationError',
      description: 'transaction failed: Insufficient permissions; permission "delete" required',
      items: [{index: 0, error: {type: 'insufficientPermissionsError', permission: 'delete'}}],
    },
  })
}

function referencesError() {
  return Object.assign(new Error('Mutation failed'), {
    details: {
      type: 'mutationError',
      description: 'Document "_.variants.a" cannot be deleted as there are references to it',
      items: [
        {
          index: 0,
          error: {
            type: 'documentHasExistingReferencesError',
            id: '_.variants.a',
            referencingIDs: ['versions.scope.doc-1'],
          },
        },
      ],
    },
  })
}

describe('createVariantPermissionsStore', () => {
  it('dry-runs the action and resolves true when it succeeds', async () => {
    const deleteVariant = namedAction('deleteVariant', () =>
      Promise.resolve({transactionId: 'txn'}),
    )
    const store = createVariantPermissionsStore()

    await expect(store.checkWithPermissionGuard(deleteVariant, '_.variants.a')).resolves.toBe(true)
    expect(deleteVariant).toHaveBeenCalledWith('_.variants.a', DRY_RUN_OPTIONS)
  })

  it('resolves false when the dry run is refused for insufficient permissions', async () => {
    const deleteVariant = namedAction('deleteVariant', () => Promise.reject(permissionError()))
    const store = createVariantPermissionsStore()

    await expect(store.checkWithPermissionGuard(deleteVariant, '_.variants.a')).resolves.toBe(false)
  })

  it('resolves true when the dry run fails for a reason other than permissions', async () => {
    const deleteVariant = namedAction('deleteVariant', () => Promise.reject(referencesError()))
    const store = createVariantPermissionsStore()

    await expect(store.checkWithPermissionGuard(deleteVariant, '_.variants.a')).resolves.toBe(true)
  })

  it('treats an action that throws synchronously like any other non-permission failure', async () => {
    const deleteVariant = namedAction('deleteVariant', () => {
      throw new Error('Release ID not found')
    })
    const store = createVariantPermissionsStore()

    await expect(store.checkWithPermissionGuard(deleteVariant, '_.variants.a')).resolves.toBe(true)
  })

  it('caches the result per action, including a non-permission failure', async () => {
    const deleteVariant = namedAction('deleteVariant', () => Promise.reject(referencesError()))
    const store = createVariantPermissionsStore()

    await expect(store.checkWithPermissionGuard(deleteVariant, '_.variants.a')).resolves.toBe(true)
    await expect(store.checkWithPermissionGuard(deleteVariant, '_.variants.b')).resolves.toBe(true)
    expect(deleteVariant).toHaveBeenCalledTimes(1)
  })

  it('shares one in-flight request between concurrent checks of the same action', async () => {
    let resolveDryRun!: (value: {transactionId: string}) => void
    const deleteVariant = namedAction(
      'deleteVariant',
      () =>
        new Promise<{transactionId: string}>((resolve) => {
          resolveDryRun = resolve
        }),
    )
    const store = createVariantPermissionsStore()

    const first = store.checkWithPermissionGuard(deleteVariant, '_.variants.a')
    const second = store.checkWithPermissionGuard(deleteVariant, '_.variants.b')
    expect(deleteVariant).toHaveBeenCalledTimes(1)

    resolveDryRun({transactionId: 'txn'})

    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
  })

  it('keys the cache by action, so different operations are checked independently', async () => {
    const deleteVariant = namedAction('deleteVariant', () => Promise.reject(permissionError()))
    const createVariant = namedAction('createVariant', () =>
      Promise.resolve({transactionId: 'txn'}),
    )
    const store = createVariantPermissionsStore()

    await expect(store.checkWithPermissionGuard(deleteVariant, '_.variants.a')).resolves.toBe(false)
    await expect(store.checkWithPermissionGuard(createVariant, {})).resolves.toBe(true)
  })
})
