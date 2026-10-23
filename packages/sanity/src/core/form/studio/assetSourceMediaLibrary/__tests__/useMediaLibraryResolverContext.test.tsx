import {createClient} from '@sanity/client'
import {type ImageSchemaType, isImageSchemaType} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {MediaLibraryIdsContext} from 'sanity/_singletons'
import {beforeAll, describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {createSchema} from '../../../../schema/createSchema'
import {FormValueProvider} from '../../../contexts/FormValue'
import {useMediaLibraryResolverContext} from '../hooks/useMediaLibraryResolverContext'

const galleryItem = {
  _key: 'item-1',
  _type: 'galleryItem',
  caption: 'First',
  image: {_type: 'image'},
}

const documentValue = {
  _id: 'article-1',
  _type: 'article',
  _createdAt: '2025-01-01T00:00:00.000Z',
  _updatedAt: '2025-01-01T00:00:00.000Z',
  _rev: 'rev-1',
  title: 'Hello',
  gallery: [galleryItem],
}

// A real client (never used for requests here) so `getMediaLibraryClient` can derive a
// Media Library-scoped client from the Studio one. Its API version differs from the one
// requested in the tests below so the `apiVersion` passthrough is observable.
const client = createClient({
  projectId: 'mock-project-id',
  dataset: 'mock-data-set',
  apiVersion: '2021-06-07',
  useCdn: false,
  maxRetries: 0,
})

function getImageSchemaType(): ImageSchemaType {
  const schema = createSchema({
    name: 'test',
    types: [{name: 'article', type: 'document', fields: [{name: 'cover', type: 'image'}]}],
  })
  const schemaType = schema.get('image')
  if (!isImageSchemaType(schemaType)) {
    throw new Error('Expected the built-in image type to be registered')
  }
  return schemaType
}

describe('useMediaLibraryResolverContext', () => {
  let TestProvider: Awaited<ReturnType<typeof createTestProvider>>

  beforeAll(async () => {
    TestProvider = await createTestProvider({client})
  })

  function createWrapper(libraryId: string | null) {
    return function Wrapper({children}: {children: ReactNode}) {
      return (
        <TestProvider>
          <MediaLibraryIdsContext.Provider
            value={libraryId ? {libraryId, organizationId: 'org-1'} : null}
          >
            <FormValueProvider value={documentValue}>{children}</FormValueProvider>
          </MediaLibraryIdsContext.Provider>
        </TestProvider>
      )
    }
  }

  it('returns null until the Media Library id is known', () => {
    const schemaType = getImageSchemaType()
    const {result} = renderHook(
      () => useMediaLibraryResolverContext({schemaType, path: ['cover']}),
      {wrapper: createWrapper(null)},
    )

    expect(result.current).toBeNull()
  })

  it('derives the parent value and path of a nested asset field', () => {
    const schemaType = getImageSchemaType()
    const path = ['gallery', {_key: 'item-1'}, 'image']
    const {result} = renderHook(() => useMediaLibraryResolverContext({schemaType, path}), {
      wrapper: createWrapper('ml-1'),
    })

    expect(result.current).not.toBeNull()
    expect(result.current!.document).toBe(documentValue)
    expect(result.current!.parentPath).toEqual(['gallery', {_key: 'item-1'}])
    expect(result.current!.parent).toBe(galleryItem)
    expect(result.current!.perspective).toEqual(['drafts'])
    expect(result.current!.currentUser?.id).toBe('doug')
    expect(result.current!.schemaType).toBe(schemaType)
    expect(result.current!.libraryId).toBe('ml-1')
    expect(typeof result.current!.getClient).toBe('function')
  })

  it('uses the document as the parent of a top-level asset field', () => {
    const schemaType = getImageSchemaType()
    const {result} = renderHook(
      () => useMediaLibraryResolverContext({schemaType, path: ['cover']}),
      {wrapper: createWrapper('ml-1')},
    )

    expect(result.current!.parentPath).toEqual([])
    expect(result.current!.parent).toBe(documentValue)
  })

  it('treats a missing path as the document root', () => {
    const schemaType = getImageSchemaType()
    const {result} = renderHook(() => useMediaLibraryResolverContext({schemaType}), {
      wrapper: createWrapper('ml-1'),
    })

    expect(result.current!.parentPath).toEqual([])
    expect(result.current!.parent).toBe(documentValue)
  })

  it('scopes the Media Library client to the connected library', () => {
    const schemaType = getImageSchemaType()
    const {result} = renderHook(
      () => useMediaLibraryResolverContext({schemaType, path: ['cover']}),
      {wrapper: createWrapper('ml-1')},
    )

    const mediaLibraryClient = result.current!.getMediaLibraryClient({apiVersion: '2025-02-19'})
    const config = mediaLibraryClient.config()

    expect(config.resource).toEqual({id: 'ml-1', type: 'media-library'})
    expect(config.apiHost).toBe('https://mock-project-id.api.sanity.io')
    expect(config.apiVersion).toBe('2025-02-19')
  })

  it('keeps the same context object across re-renders with unchanged inputs', () => {
    const schemaType = getImageSchemaType()
    const path = ['cover']
    const {result, rerender} = renderHook(
      () => useMediaLibraryResolverContext({schemaType, path}),
      {wrapper: createWrapper('ml-1')},
    )
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })
})
