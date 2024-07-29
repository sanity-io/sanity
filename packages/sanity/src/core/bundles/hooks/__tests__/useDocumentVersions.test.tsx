import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {renderHook} from '@testing-library/react'
import {of} from 'rxjs'

import {listenQuery} from '../../../store/_legacy/document/listenQuery'
import {useBundles} from '../../../store/bundles/useBundles'
import {useDocumentVersions} from '../useDocumentVersions'

// Mock the entire module
jest.mock('../../../studio/source')

jest.mock('../../../hooks/useClient', () => ({
  useClient: jest.fn(() => ({fetch: jest.fn()})),
}))

jest.mock('../../../store/bundles/useBundles')
const mockedUseBundles = useBundles as jest.Mock

jest.mock('../../../store/_legacy/document/listenQuery')
const mockedListenQuery = listenQuery as jest.Mock

describe('useDocumentVersions', () => {
  const mockBundles = [
    {
      description: 'What a spring drop, allergies galore 🌸',
      _updatedAt: '2024-07-12T10:39:32Z',
      _rev: 'HdJONGqRccLIid3oECLjYZ',
      authorId: 'pzAhBTkNX',
      title: 'Spring Drop',
      icon: 'heart-filled',
      _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
      _type: 'bundle',
      slug: 'spring-drop',
      hue: 'magenta',
      _createdAt: '2024-07-02T11:37:51Z',
    },
    {
      description: 'What a winter drop',
      _updatedAt: '2024-07-12T10:39:32Z',
      _rev: 'HdJONGqRccLIid3oECLjYZ',
      authorId: 'pzAhBTkNX',
      title: 'Winter Drop',
      icon: 'heart-filled',
      _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
      _type: 'bundle',
      slug: 'winter-drop',
      hue: 'grey',
      _createdAt: '2024-07-02T11:37:51Z',
    },
  ]

  beforeEach(() => {
    mockedUseBundles.mockReturnValue({data: mockBundles, loading: false, dispatch: jest.fn()})
  })

  it('should return initial state', () => {
    mockedListenQuery.mockReturnValue(of(null))

    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toBeNull()
  })

  it('should return an empty array if no versions are found', () => {
    mockedListenQuery.mockReturnValue(of([]))
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toEqual([])
  })

  it('should return the bundles if versions are found', () => {
    mockedListenQuery.mockReturnValue(
      of([
        {
          _id: 'spring-drop.document-1',
          _version: {},
        },
      ]),
    )
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toEqual([mockBundles[0]])
  })
  it('should not crash if version bundle is not found', () => {
    mockedListenQuery.mockReturnValue(
      of([
        {
          _id: 'missing-drop.document-1',
          _version: {},
        },
      ]),
    )
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toEqual([])
  })
})
