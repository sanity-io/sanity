import React from 'react'
import {render} from '@testing-library/react'
import {Panes} from '../../structureResolvers'
import * as USE_DESK_TOOL from '../../useDeskTool'
import {DeskTitle} from './DeskTitle'
import * as SANITY from 'sanity'

jest.mock('sanity')

describe('DeskTitle', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore  it's a minimal mock implementation of useDeskTool
  jest.spyOn(USE_DESK_TOOL, 'useDeskTool').mockImplementation(() => ({
    structureContext: {title: 'My Desk Tool'},
  }))
  describe('Non document panes', () => {
    const mockPanes: Panes['resolvedPanes'] = [
      {
        id: 'content',
        type: 'list',
        title: 'Content',
      },
      {
        id: 'author',
        type: 'documentList',
        title: 'Author',
        schemaTypeName: 'author',
        options: {
          filter: '_type == $type',
        },
      },
      {
        id: 'documentEditor',
        type: 'document',
        title: 'Authors created',
        options: {
          id: 'fake-document',
          type: 'author',
        },
      },
    ]
    beforeEach(() => {
      document.title = 'Sanity Studio'
    })
    it('renders the correct title when the content pane is open', () => {
      render(<DeskTitle resolvedPanes={mockPanes.slice(0, 1)} />)
      expect(document.title).toBe('Content | My Desk Tool')
    })
    it('renders the correct title when an inner pane is open', () => {
      render(<DeskTitle resolvedPanes={mockPanes.slice(0, 2)} />)
      expect(document.title).toBe('Author | My Desk Tool')
    })
    it('renders the correct title when the document pane has a title', () => {
      render(<DeskTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('Authors created | My Desk Tool')
    })
    it('should not update the title if no panes are available', () => {
      render(<DeskTitle resolvedPanes={[]} />)
      expect(document.title).toBe('Sanity Studio')
    })
  })
  describe('With document panes', () => {
    const mockPanes: Panes['resolvedPanes'] = [
      {
        id: 'content',
        type: 'list',
        title: 'Content',
      },
      {
        id: 'author',
        type: 'documentList',
        title: 'Author',
        schemaTypeName: 'author',
        options: {
          filter: '_type == $type',
        },
      },
      {
        id: 'documentEditor',
        type: 'document',
        title: '',
        options: {
          id: 'fake-document',
          type: 'author',
        },
      },
    ]

    const doc = {
      name: 'Foo',
      _id: 'drafts.fake-document',
      _type: 'author',
      _updatedAt: '',
      _createdAt: '',
      _rev: '',
    }
    const editState = {
      ready: true,
      type: 'author',
      draft: doc,
      published: null,
      id: 'fake-document',
      transactionSyncLock: {enabled: false},
      liveEdit: false,
    }
    const valuePreview = {
      isLoading: false,
      value: {
        title: doc.name,
      },
    }
    const useSchemaMock = () =>
      ({
        get: () => ({
          title: 'Author',
          name: 'author',
          type: 'document',
        }),
      }) as unknown as SANITY.Schema

    it('should not update the when the document is still loading', () => {
      const useEditStateMock = () => ({...editState, ready: false})
      const useValuePreviewMock = () => valuePreview
      jest.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      jest.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      jest.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      document.title = 'Sanity Studio'
      render(<DeskTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('Sanity Studio')
    })

    it('renders the correct title when the document pane has a title', () => {
      const useEditStateMock = () => editState
      const useValuePreviewMock = () => valuePreview
      jest.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      jest.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      jest.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      document.title = 'Sanity Studio'
      render(<DeskTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('Foo | My Desk Tool')
    })
    it('renders the correct title when the document is new', () => {
      const useEditStateMock = () => ({...editState, draft: null})
      const useValuePreviewMock = () => valuePreview
      jest.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      jest.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      jest.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      document.title = 'Sanity Studio'
      render(<DeskTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('New Author | My Desk Tool')
    })
    it('renders the correct title when the document is untitled', () => {
      const useEditStateMock = () => editState
      const useValuePreviewMock = () => ({
        isLoading: false,
        value: {title: ''},
      })
      jest.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      jest.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      jest.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      document.title = 'Sanity Studio'
      render(<DeskTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('Untitled | My Desk Tool')
    })
  })
})
