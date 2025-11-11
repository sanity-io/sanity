import {render, waitFor} from '@testing-library/react'
import {
  defineConfig,
  type SanityClient,
  useActiveReleases,
  useArchivedReleases,
  useDocumentVersions,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {beforeEach, describe, expect, it, type Mock, type MockedFunction, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {usePerspectiveMockReturn} from '../../../../../../__mocks__/usePerspective.mock'
import {structureUsEnglishLocaleBundle} from '../../../../../../i18n'
import {
  mockUseDocumentTitle,
  useDocumentTitleMockReturn,
} from '../../../../__mocks__/useDocumentTitle.mock'
import {type DocumentPaneContextValue} from '../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DocumentHeaderTitle} from '../../DocumentHeaderTitle'

function createWrapperComponent(client: SanityClient) {
  const config = defineConfig({
    projectId: 'test',
    dataset: 'test',
  })

  return createTestProvider({
    client,
    config,
    resources: [structureUsEnglishLocaleBundle],
  })
}

vi.mock('../../../../../../../core/releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(),
}))

vi.mock('../../../../../../../core/releases/store/useReleasesIds', () => ({
  useReleasesIds: vi.fn(),
}))

vi.mock('../../../../../../../core/releases/store/useArchivedReleases', () => ({
  useArchivedReleases: vi.fn(),
}))

vi.mock('../../../../useDocumentPane')

vi.mock('../../../../useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(() => useDocumentTitleMockReturn),
}))

vi.mock('sanity', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useDocumentVersions: vi.fn(),
    usePerspective: vi.fn(() => usePerspectiveMockReturn),
  }
})

vi.mock('sanity/router')

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseArchivedReleases = useArchivedReleases as Mock<typeof useArchivedReleases>

const mockUseDocumentVersions = useDocumentVersions as MockedFunction<typeof useDocumentVersions>

describe('DocumentHeaderTitle', () => {
  const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>
  const mockUseRouter = useRouter as MockedFunction<typeof useRouter>
  const defaultProps = {
    connectionState: 'connected',
    schemaType: {title: 'Test Schema', name: 'testSchema'},
    editState: {draft: {title: 'Test Value', _createdAt: new Date()}},
  }

  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue(defaultProps as unknown as DocumentPaneContextValue)
    // oxlint-disable-next-line ban-ts-comment
    // @ts-expect-error
    mockUseRouter.mockReturnValue({stickyParams: {}, state: {}, navigate: vi.fn()})
    mockUseDocumentVersions.mockReturnValue({data: [], loading: false, error: undefined})
    mockUseActiveReleases.mockReturnValue({
      data: [],
      loading: false,
      dispatch: vi.fn(),
    })

    mockUseArchivedReleases.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
    })

    global.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('should render without crashing', async () => {
    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText, findByText} = render(<DocumentHeaderTitle />, {wrapper})
    await findByText('New Test Schema')
  })

  it('should return an empty fragment when connectionState is not "connected" and editState is empty', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      connectionState: 'connecting',
      editState: null,
    } as unknown as DocumentPaneContextValue)

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {container} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(container.textContent).toBe(''))
  })

  it('should render the header title when connectionState is not "connected" and editState has values', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      connectionState: 'reconnecting',
      value: {title: 'Test Value'},
      title: 'Test Title',
    } as unknown as DocumentPaneContextValue)

    mockUseDocumentTitle.mockReturnValue({
      error: undefined,
      title: 'Test Value',
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {findByText} = render(<DocumentHeaderTitle />, {wrapper})
    await findByText('Test Title')
  })

  it('should return the title if it is provided', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      title: 'Test Title',
    } as unknown as DocumentPaneContextValue)

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText, findByText} = render(<DocumentHeaderTitle />, {wrapper})
    await findByText('Test Title')
  })

  it('should return "New {schemaType?.title || schemaType?.name}" if documentValue is not provided', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      editState: null,
    } as unknown as DocumentPaneContextValue)

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText, findByText} = render(<DocumentHeaderTitle />, {wrapper})
    await findByText('New Test Schema')
  })

  it('should return the value.title if value is provided and no error occurred', async () => {
    mockUseDocumentTitle.mockReturnValue({
      error: undefined,
      title: 'Test Preview Value',
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText, findByText} = render(<DocumentHeaderTitle />, {wrapper})
    await findByText('New Test Schema')
  })

  it('should return "New Test Schema" if value is not provided and no error occurred', async () => {
    mockUseDocumentTitle.mockReturnValue({error: undefined, title: undefined})

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText, findByText} = render(<DocumentHeaderTitle />, {wrapper})
    await findByText('New Test Schema')
  })

  it('should return "Error: {error.message}" if an error occurred while getting the preview value', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      value: {title: 'Test Preview Value'},
    } as unknown as DocumentPaneContextValue)

    mockUseDocumentTitle.mockReturnValue({
      ...useDocumentTitleMockReturn,
      error: 'Test Error',
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText, findByText} = render(<DocumentHeaderTitle />, {wrapper})
    await findByText('Error: Test Error')
  })

  it('should display the value returned by useValuePreview hook correctly when no error occurs', async () => {
    mockUseDocumentTitle.mockReturnValue({
      error: undefined,
      title: 'Test Title',
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText, findByText} = render(<DocumentHeaderTitle />, {wrapper})
    await findByText('New Test Schema')
  })
})
