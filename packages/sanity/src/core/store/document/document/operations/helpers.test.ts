import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockDocumentOperationArgs} from '../__tests__/operationTestUtils'
import {emitDocumentOperation} from '../documentOperationEvents'
import {createDocumentOperationsAPI, GUARDED} from './helpers'

vi.mock('../documentOperationEvents', () => ({
  emitDocumentOperation: vi.fn(),
  getDocumentOperationStoreKey: vi.fn(() => 'store-key'),
}))

const emitDocumentOperationMock = vi.mocked(emitDocumentOperation)

describe('operations helpers', () => {
  beforeEach(() => {
    emitDocumentOperationMock.mockClear()
  })

  it('guards every operation before arguments are ready', () => {
    for (const [operationName, operation] of Object.entries(GUARDED)) {
      expect(operation.disabled).toBe('NOT_READY')
      expect(() => operation.execute()).toThrow(`Called ${operationName} before it was ready.`)
    }
  })

  it('creates an operations api with disabled states from each implementation', () => {
    const api = createDocumentOperationsAPI(createMockDocumentOperationArgs({snapshot: null}))

    expect(api.commit.disabled).toBe(false)
    expect(api.delete.disabled).toBe('NOTHING_TO_DELETE')
    expect(api.del.disabled).toBe('NOTHING_TO_DELETE')
    expect(api.publish.disabled).toBe('ALREADY_PUBLISHED')
    expect(api.patch.disabled).toBe(false)
    expect(api.discardChanges.disabled).toBe('NO_CHANGES')
    expect(api.unpublish.disabled).toBe('NOT_PUBLISHED')
    expect(api.duplicate.disabled).toBe('NOTHING_TO_DUPLICATE')
    expect(api.restore.disabled).toBe(false)
  })

  it('emits document operations when wrapped execute methods are called', () => {
    const api = createDocumentOperationsAPI(createMockDocumentOperationArgs())

    api.patch.execute([{set: {title: 'Alien'}}], {_id: 'drafts.example-id'})

    expect(emitDocumentOperationMock).toHaveBeenCalledWith(
      'patch',
      'drafts.example-id',
      [[{set: {title: 'Alien'}}], {_id: 'drafts.example-id'}],
      'store-key',
    )
  })
})
