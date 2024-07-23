import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {renderHook} from '@testing-library/react'
import {useBundles, useClient} from 'sanity'

import {useDocumentVersions} from '../useDocumentVersions'

// Mock the entire module
jest.mock('../../../studio/source')

jest.mock('sanity', () => {
  const actual = jest.requireActual('sanity')
  return Object.assign({}, actual, {
    useClient: jest.fn(),
    useBundles: jest.fn(() => ({data: {}})),
    getPublishedId: jest.fn(),
  })
})

const mockedUseClient = useClient as jest.Mock
const mockedUseBundles = useBundles as jest.Mock

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
    mockedUseClient.mockImplementation(() => ({fetch: jest.fn()}))
    mockedUseBundles.mockReturnValue({data: mockBundles, loading: false, dispatch: jest.fn()})
  })

  it('should return initial state', () => {
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toBeNull()
  })
})
