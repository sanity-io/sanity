import {createClient} from '@sanity/client'
import {isImageSchemaType, type MediaLibraryResolverContext} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, type MockInstance, vi} from 'vitest'

import {createSchema} from '../../../../schema/createSchema'
import {resolveMediaLibraryOption} from '../resolveMediaLibraryOption'

function createContext(): MediaLibraryResolverContext {
  const client = createClient({
    projectId: 'abc123',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  const schema = createSchema({
    name: 'test',
    types: [{name: 'article', type: 'document', fields: [{name: 'cover', type: 'image'}]}],
  })
  const schemaType = schema.get('image')
  if (!isImageSchemaType(schemaType)) {
    throw new Error('Expected the built-in image type to be registered')
  }
  const document = {
    _id: 'article-1',
    _type: 'article',
    _createdAt: '2025-01-01T00:00:00.000Z',
    _updatedAt: '2025-01-01T00:00:00.000Z',
    _rev: 'rev-1',
  }
  return {
    document,
    parent: document,
    parentPath: [],
    perspective: ['drafts'],
    getClient: () => client,
    currentUser: null,
    schemaType,
    libraryId: 'ml-1',
    getMediaLibraryClient: () => client,
  }
}

describe('resolveMediaLibraryOption', () => {
  let consoleError: MockInstance<typeof console.error>

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleError.mockRestore()
    vi.useRealTimers()
  })

  it('resolves undefined when the option is not configured', async () => {
    await expect(resolveMediaLibraryOption(undefined, createContext())).resolves.toBeUndefined()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('returns a static value as-is', async () => {
    const filters = [{name: 'Images', query: '_type == "sanity.asset"'}]

    await expect(resolveMediaLibraryOption(filters, createContext())).resolves.toBe(filters)
  })

  it('calls a synchronous resolver with the context and returns its value', async () => {
    const context = createContext()
    const resolver = vi.fn((ctx: MediaLibraryResolverContext) => `library:${ctx.libraryId}`)

    await expect(resolveMediaLibraryOption(resolver, context)).resolves.toBe('library:ml-1')
    expect(resolver).toHaveBeenCalledTimes(1)
    expect(resolver).toHaveBeenCalledWith(context)
  })

  it('awaits an asynchronous resolver', async () => {
    const resolver = vi.fn(async (ctx: MediaLibraryResolverContext) => {
      await Promise.resolve()
      return {folderId: `folder-for-${ctx.document._type}`}
    })

    await expect(resolveMediaLibraryOption(resolver, createContext())).resolves.toEqual({
      folderId: 'folder-for-article',
    })
  })

  it('resolves undefined when the resolver returns undefined', async () => {
    const resolver = (): string | undefined => undefined

    await expect(resolveMediaLibraryOption(resolver, createContext())).resolves.toBeUndefined()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('resolves undefined and reports a resolver that throws synchronously', async () => {
    const error = new Error('boom')
    const resolver = (): string => {
      throw error
    }

    await expect(
      resolveMediaLibraryOption(resolver, createContext(), {optionName: 'filters'}),
    ).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('filters'), error)
  })

  it('resolves undefined and reports a resolver whose promise rejects', async () => {
    const error = new Error('async boom')
    const resolver = (): Promise<string> => Promise.reject(error)

    await expect(
      resolveMediaLibraryOption(resolver, createContext(), {optionName: 'uploadTo'}),
    ).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('uploadTo'), error)
  })

  it('gives up on a resolver that never settles once the timeout elapses', async () => {
    vi.useFakeTimers()
    const resolver = (): Promise<string> => new Promise<string>(() => undefined)

    const pending = resolveMediaLibraryOption(resolver, createContext(), {
      timeoutMs: 50,
      optionName: 'filters',
    })

    await vi.advanceTimersByTimeAsync(49)
    expect(consoleError).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await expect(pending).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('filters'))
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('50'))
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not report a timeout for a resolver that settles in time', async () => {
    vi.useFakeTimers()
    const resolver = async (): Promise<string> => {
      await Promise.resolve()
      return 'done'
    }

    await expect(
      resolveMediaLibraryOption(resolver, createContext(), {timeoutMs: 50}),
    ).resolves.toBe('done')

    await vi.advanceTimersByTimeAsync(100)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('clears the timeout once the resolver has settled', async () => {
    vi.useFakeTimers()

    await resolveMediaLibraryOption(() => 'sync', createContext())
    expect(vi.getTimerCount()).toBe(0)

    await resolveMediaLibraryOption(() => Promise.resolve('async'), createContext())
    expect(vi.getTimerCount()).toBe(0)

    await resolveMediaLibraryOption(() => {
      throw new Error('boom')
    }, createContext())
    expect(vi.getTimerCount()).toBe(0)
  })
})
