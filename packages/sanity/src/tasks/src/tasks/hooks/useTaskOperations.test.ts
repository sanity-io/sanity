import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook} from '@testing-library/react'
import {type SanityClient} from 'sanity'

import {useTaskOperations} from './useTaskOperations'

const mockCreateAction = jest.fn()
const mockCommit = jest.fn()
const mockSet = jest.fn(() => ({commit: mockCommit}))
const mockPatchAction = jest.fn(() => ({set: mockSet}))
const mockDeleteAction = jest.fn()

jest.mock('sanity', () => ({
  useAddonDataset: jest.fn(() => {
    return {
      client: {
        create: mockCreateAction,
        patch: mockPatchAction,
        delete: mockDeleteAction,
      },
      createAddonDataset: jest.fn(),
    }
  }),
  useCurrentUser: jest.fn(() => ({
    id: 'user123',
  })),
}))

describe('tests useTaskOperations', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it("creates the addonDataset if it doesn't exist", async () => {
    const mockedCreateAddonDataset = jest.fn(async () => {
      return {
        create: mockCreateAction,
        patch: mockPatchAction,
        delete: mockDeleteAction,
      } as unknown as SanityClient
    })
    require('sanity').useAddonDataset.mockReturnValueOnce({
      client: null,
      isCreatingDataset: false,
      ready: false,
      createAddonDataset: mockedCreateAddonDataset,
    })

    const {result} = renderHook(() => useTaskOperations())
    await act(async () => {
      await result.current.create({title: 'Test Task', description: [], status: 'open'})
    })
    expect(mockedCreateAddonDataset).toHaveBeenCalled()
    expect(mockCreateAction).toHaveBeenCalledWith({
      title: 'Test Task',
      authorId: 'user123',
      description: [],
      status: 'open',
      _type: 'tasks.task',
    })
  })

  it('creates a task', async () => {
    const {result} = renderHook(() => useTaskOperations())

    result.current.create({title: 'Test Task', description: [], status: 'open'})

    expect(mockCreateAction).toHaveBeenCalledWith({
      title: 'Test Task',
      authorId: 'user123',
      description: [],
      status: 'open',
      _type: 'tasks.task',
    })
  })

  it('edits a task', async () => {
    const {result} = renderHook(() => useTaskOperations())

    await act(async () => {
      await result.current.edit('task123', {status: 'closed'})
    })
    expect(mockPatchAction).toHaveBeenCalledWith('task123')
    expect(mockSet).toHaveBeenCalledWith({status: 'closed'})
    expect(mockCommit).toHaveBeenCalled()
  })

  it('deletes a task', async () => {
    const {result} = renderHook(() => useTaskOperations())

    await act(async () => {
      await result.current.remove('task123')
    })
    expect(mockDeleteAction).toHaveBeenCalledWith('task123')
  })
})
