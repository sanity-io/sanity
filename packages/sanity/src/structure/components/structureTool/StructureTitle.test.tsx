import {render, waitFor} from '@testing-library/react'
// eslint-disable-next-line no-restricted-imports
import * as SANITY from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../i18n'
import {type StructureContext} from '../../structureBuilder'
import {type Panes} from '../../structureResolvers'
import * as USE_STRUCTURE_TOOL from '../../useStructureTool'
import {DocumentTitle, StructureTitle} from './StructureTitle'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useEditState: vi.fn(),
  useSchema: vi.fn(),
  useValuePreview: vi.fn(),
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
  // @ts-expect-error  it's a minimal mock implementation of useStructureTool
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
      vi.clearAllMocks()
    })
    it('renders the correct title when the content pane is open', async () => {
      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      render(<StructureTitle resolvedPanes={mockPanes.slice(0, 1)} />, {wrapper})
      await waitFor(() => {
        expect(document.title).toBe('Content | My Structure Tool')
      })
    })
    it('renders the correct title when an inner pane is open', async () => {
      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      render(<StructureTitle resolvedPanes={mockPanes.slice(0, 2)} />, {wrapper})
      await waitFor(() => {
        expect(document.title).toBe('Author | My Structure Tool')
      })
    })
    it('renders the correct title when the document pane has a title', async () => {
      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      render(<StructureTitle resolvedPanes={mockPanes} />, {wrapper})
      await waitFor(() => {
        expect(document.title).toBe('Authors created | My Structure Tool')
      })
    })
    it('should not update the title if no panes are available', async () => {
      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      render(<StructureTitle resolvedPanes={[]} />, {wrapper})
      await waitFor(() => {
        expect(document.title).toBe('Sanity Studio')
      })
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

    const documentPaneSchemaType = {
      title: 'Author',
      name: 'author',
      type: 'document',
    } as const

    /** DocumentTitle treats missing/falsy `_createdAt` as a new document; keep `doc` unchanged for editState. */
    const displayedExistingDoc = {...doc, _createdAt: '2021-01-01', _updatedAt: '2021-01-01'}

    beforeEach(() => {
      document.title = 'Sanity Studio'
      vi.clearAllMocks()
    })

    it('should not update the when the document is still loading', async () => {
      const useEditStateMock = () => ({
        ...editState,
        ready: false,
        version: null,
        liveEditSchemaType: false,
        release: undefined,
      })

      const useValuePreviewMock = () => valuePreview
      vi.spyOn(SANITY, 'useSchema').mockImplementation(useSchemaMock)
      vi.spyOn(SANITY, 'useEditState').mockImplementation(useEditStateMock)
      vi.spyOn(SANITY, 'useValuePreview').mockImplementation(useValuePreviewMock)

      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      document.title = 'Sanity Studio'
      render(
        <>
          <StructureTitle resolvedPanes={mockPanes} />
          <DocumentTitle
            displayed={displayedExistingDoc}
            isDeleted={false}
            ready={false}
            schemaType={documentPaneSchemaType as any}
          />
        </>,
        {wrapper},
      )
      await waitFor(() => {
        expect(document.title).toBe('Sanity Studio')
      })
    })

    it('renders the correct title when the document pane has a title', async () => {
      const useEditStateMock = () => ({
        ...editState,
        version: null,
        liveEditSchemaType: false,
        release: undefined,
      })
      const useValuePreviewMock = () => valuePreview
      vi.spyOn(SANITY, 'useSchema').mockImplementation(useSchemaMock)
      vi.spyOn(SANITY, 'useEditState').mockImplementation(useEditStateMock)
      vi.spyOn(SANITY, 'useValuePreview').mockImplementation(useValuePreviewMock)

      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      document.title = 'Sanity Studio'
      render(
        <>
          <StructureTitle resolvedPanes={mockPanes} />
          <DocumentTitle
            displayed={displayedExistingDoc}
            isDeleted={false}
            ready
            schemaType={documentPaneSchemaType as any}
          />
        </>,
        {wrapper},
      )
      await waitFor(() => {
        expect(document.title).toBe('Foo | My Structure Tool')
      })
    })
    it('renders the correct title when the document is new', async () => {
      const useValuePreviewMock = () => valuePreview
      vi.spyOn(SANITY, 'useSchema').mockImplementation(useSchemaMock)
      vi.spyOn(SANITY, 'useValuePreview').mockImplementation(useValuePreviewMock)

      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      document.title = 'Sanity Studio'
      render(
        <>
          <StructureTitle resolvedPanes={mockPanes} />
          <DocumentTitle
            displayed={{
              _id: doc._id,
              _type: doc._type,
            }}
            isDeleted={false}
            ready
            schemaType={documentPaneSchemaType as any}
          />
        </>,
        {wrapper},
      )
      await waitFor(() => {
        expect(document.title).toBe('New Author | My Structure Tool')
      })
    })
    it('renders the correct title when the document is untitled', async () => {
      const useValuePreviewMock = () => ({
        isLoading: false,
        value: {title: ''},
      })
      vi.spyOn(SANITY, 'useSchema').mockImplementation(useSchemaMock)
      vi.spyOn(SANITY, 'useValuePreview').mockImplementation(useValuePreviewMock)

      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      document.title = 'Sanity Studio'
      render(
        <>
          <StructureTitle resolvedPanes={mockPanes} />
          <DocumentTitle
            displayed={displayedExistingDoc}
            isDeleted={false}
            ready
            schemaType={documentPaneSchemaType as any}
          />
        </>,
        {wrapper},
      )
      await waitFor(() => {
        expect(document.title).toBe('Untitled | My Structure Tool')
      })
    })
    it('renders the correct title when the document is deleted', async () => {
      const useValuePreviewMock = () => valuePreview
      vi.spyOn(SANITY, 'useSchema').mockImplementation(useSchemaMock)
      vi.spyOn(SANITY, 'useValuePreview').mockImplementation(useValuePreviewMock)

      const client = createMockSanityClient()
      const wrapper = await createWrapperComponent(client as any)

      document.title = 'Sanity Studio'
      render(
        <>
          <StructureTitle resolvedPanes={mockPanes} />
          <DocumentTitle
            displayed={displayedExistingDoc}
            isDeleted
            ready
            schemaType={documentPaneSchemaType as any}
          />
        </>,
        {wrapper},
      )
      await waitFor(() => {
        expect(document.title).toBe('My Structure Tool')
      })
    })
  })
})
