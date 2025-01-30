import {render} from '@testing-library/react'
import * as SANITY from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../i18n'
import {type StructureContext} from '../../structureBuilder'
import {type Panes} from '../../structureResolvers'
import * as USE_STRUCTURE_TOOL from '../../useStructureTool'
import {StructureTitle} from './StructureTitle'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useEditState: vi.fn(),
  useSchema: vi.fn(),
  unstable_useValuePreview: vi.fn(),
  usePerspective: vi.fn(() => ({perspective: undefined})),
}))

function createWrapperComponent(client: SANITY.SanityClient) {
  const config = SANITY.defineConfig({
    projectId: 'test',
    dataset: 'test',
  })

  return createTestProvider({
    client,
    config,
    resources: [structureUsEnglishLocaleBundle],
  })
}

describe('StructureTitle', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore  it's a minimal mock implementation of useStructureTool
  vi.spyOn(USE_STRUCTURE_TOOL, 'useStructureTool').mockImplementation(() => ({
    structureContext: {title: 'My Structure Tool'} as StructureContext,
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
    it('renders the correct title when the content pane is open', async () => {
      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      render(<StructureTitle resolvedPanes={mockPanes.slice(0, 1)} />, {wrapper})
      expect(document.title).toBe('Content | My Structure Tool')
    })
    it('renders the correct title when an inner pane is open', async () => {
      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      render(<StructureTitle resolvedPanes={mockPanes.slice(0, 2)} />, {wrapper})
      expect(document.title).toBe('Author | My Structure Tool')
    })
    it('renders the correct title when the document pane has a title', async () => {
      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      render(<StructureTitle resolvedPanes={mockPanes} />, {wrapper})
      expect(document.title).toBe('Authors created | My Structure Tool')
    })
    it('should not update the title if no panes are available', async () => {
      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      render(<StructureTitle resolvedPanes={[]} />, {wrapper})
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

    it('should not update the when the document is still loading', async () => {
      const useEditStateMock = () => ({...editState, ready: false})
      const useValuePreviewMock = () => valuePreview
      vi.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      vi.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      vi.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      document.title = 'Sanity Studio'
      render(<StructureTitle resolvedPanes={mockPanes} />, {wrapper})
      expect(document.title).toBe('Sanity Studio')
    })

    it('renders the correct title when the document pane has a title', async () => {
      const useEditStateMock = () => editState
      const useValuePreviewMock = () => valuePreview
      vi.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      vi.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      vi.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      document.title = 'Sanity Studio'
      render(<StructureTitle resolvedPanes={mockPanes} />, {wrapper})
      expect(document.title).toBe('Foo | My Structure Tool')
    })
    it('renders the correct title when the document is new', async () => {
      const useEditStateMock = () => ({...editState, draft: null})
      const useValuePreviewMock = () => valuePreview
      vi.spyOn(SANITY, 'useSchema').mockImplementationOnce(useSchemaMock)
      vi.spyOn(SANITY, 'useEditState').mockImplementationOnce(useEditStateMock)
      vi.spyOn(SANITY, 'unstable_useValuePreview').mockImplementationOnce(useValuePreviewMock)

      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      document.title = 'Sanity Studio'
      render(<StructureTitle resolvedPanes={mockPanes} />, {wrapper})
      expect(document.title).toBe('New Author | My Structure Tool')
    })
    it('renders the correct title when the document is untitled', async () => {
      const useEditStateMock = () => editState
      const useValuePreviewMock = () => ({
        isLoading: false,
        value: {title: ''},
      })
      vi.spyOn(SANITY, 'useSchema').mockImplementation(useSchemaMock)
      vi.spyOn(SANITY, 'useEditState').mockImplementation(useEditStateMock)
      vi.spyOn(SANITY, 'unstable_useValuePreview').mockImplementation(useValuePreviewMock)

      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      document.title = 'Sanity Studio'
      render(<StructureTitle resolvedPanes={mockPanes} />, {wrapper})
      expect(document.title).toBe('Untitled | My Structure Tool')
    })
  })
})
