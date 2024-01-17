import React from 'react'
import {render} from '@testing-library/react'
import {Panes} from '../../structureResolvers'
import * as USE_STRUCTURE_TOOL from '../../useStructureTool'
import {StructureTitle} from './StructureTitle'
import * as SANITY from 'sanity'

jest.mock('sanity')

describe('StructureTitle', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore  it's a minimal mock implementation of useStructureTool
  jest.spyOn(USE_STRUCTURE_TOOL, 'useStructureTool').mockImplementation(() => ({
    structureContext: {title: 'My Structure Tool'},
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
      render(<StructureTitle resolvedPanes={mockPanes.slice(0, 1)} />)
      expect(document.title).toBe('Content | My Structure Tool')
    })
    it('renders the correct title when an inner pane is open', () => {
      render(<StructureTitle resolvedPanes={mockPanes.slice(0, 2)} />)
      expect(document.title).toBe('Author | My Structure Tool')
    })
    it('renders the correct title when the document pane has a title', () => {
      render(<StructureTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('Authors created | My Structure Tool')
    })
    it('should not update the title if no panes are available', () => {
      render(<StructureTitle resolvedPanes={[]} />)
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
      const useTranslationMock = () =>
        ({t: () => 'My title'}) as SANITY.UseTranslationResponse<string, string>
      jest.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      jest.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      jest.spyOn(SANITY, 'useTranslation').mockImplementationOnce(useTranslationMock)
      jest.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      document.title = 'Sanity Studio'
      render(<StructureTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('Sanity Studio')
    })

    it('renders the correct title when the document pane has a title', () => {
      const useEditStateMock = () => editState
      const useValuePreviewMock = () => valuePreview
      const useTranslationMock = () =>
        ({t: () => 'My title'}) as SANITY.UseTranslationResponse<string, string>
      jest.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      jest.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      jest.spyOn(SANITY, 'useTranslation').mockImplementationOnce(useTranslationMock)
      jest.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      document.title = 'Sanity Studio'
      render(<StructureTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('Foo | My Structure Tool')
    })
    it('renders the correct title when the document is new', () => {
      const useEditStateMock = () => ({...editState, draft: null})
      const useValuePreviewMock = () => valuePreview
      const useTranslationMock = () =>
        ({
          t: (key: string, values: Record<string, string>) => {
            expect(key).toBe('browser-document-title.new-document')
            expect(values).toHaveProperty('schemaType', 'Author')
            return `New ${values.schemaType}`
          },
        }) as SANITY.UseTranslationResponse<string, string>
      jest.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      jest.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      jest.spyOn(SANITY, 'useTranslation').mockImplementationOnce(useTranslationMock)
      jest.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      document.title = 'Sanity Studio'
      render(<StructureTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('New Author | My Structure Tool')
    })
    it('renders the correct title when the document is untitled', () => {
      const useEditStateMock = () => editState
      const useValuePreviewMock = () => ({
        isLoading: false,
        value: {title: ''},
      })
      const tMock = jest.fn().mockReturnValue('Untitled')
      jest.spyOn(SANITY, 'useSchema').mockImplementation(useSchemaMock)
      jest.spyOn(SANITY, 'useEditState').mockImplementation(useEditStateMock)
      jest.spyOn(SANITY, 'useTranslation').mockImplementation(jest.fn().mockReturnValue({t: tMock}))
      jest.spyOn(SANITY, 'unstable_useValuePreview').mockImplementation(useValuePreviewMock)

      document.title = 'Sanity Studio'
      render(<StructureTitle resolvedPanes={mockPanes} />)
      expect(document.title).toBe('Untitled | My Structure Tool')
      expect(tMock).toHaveBeenCalledWith('browser-document-title.untitled-document')
    })
  })
})
