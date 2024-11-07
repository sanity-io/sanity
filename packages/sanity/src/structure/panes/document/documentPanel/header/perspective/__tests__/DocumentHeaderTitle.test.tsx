import {render, waitFor} from '@testing-library/react'
import {
  defineConfig,
  type SanityClient,
  unstable_useValuePreview as useValuePreview,
  useDocumentVersions,
  useReleases,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {beforeEach, describe, expect, it, type Mock, type MockedFunction, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../../i18n'
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

vi.mock('../../../../useDocumentPane')

vi.mock('sanity', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    unstable_useValuePreview: vi.fn(),
    useDocumentVersions: vi.fn(),
    useReleases: vi.fn(),
    usePerspective: vi.fn(() => ({perspective: undefined})),
  }
})

vi.mock('sanity/router')

const mockUseReleases = useReleases as Mock<typeof useReleases>
const mockUseDocumentVersions = useDocumentVersions as MockedFunction<typeof useDocumentVersions>

describe('DocumentHeaderTitle', () => {
  const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>
  const mockUseValuePreview = useValuePreview as MockedFunction<typeof useValuePreview>
  const mockUseRouter = useRouter as MockedFunction<typeof useRouter>
  const defaultProps = {
    connectionState: 'connected',
    schemaType: {title: 'Test Schema', name: 'testSchema'},
    editState: {draft: {title: 'Test Value', _createdAt: new Date()}},
  }

  const defaultValue = {
    isLoading: false,
  }

  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue(defaultProps as unknown as DocumentPaneContextValue)
    mockUseValuePreview.mockReturnValue({...defaultValue, error: undefined, value: undefined})
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mockUseRouter.mockReturnValue({stickyParams: {}, state: {}, navigate: vi.fn()})
    mockUseDocumentVersions.mockReturnValue({data: [], loading: false, error: undefined})
    mockUseReleases.mockReturnValue({
      data: [],
      loading: false,
      dispatch: vi.fn(),
      archivedReleases: [],
      releasesIds: [],
    })

    global.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('should render without crashing', async () => {
    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('New Test Schema')).toBeInTheDocument())
  })

  it('should return an empty fragment when connectionState is not "connected" and editState is empty', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      connectionState: 'connecting',
      editState: null,
    } as unknown as DocumentPaneContextValue)

    const {container} = render(<DocumentHeaderTitle />)
    await waitFor(() => expect(container.firstChild).toBeNull())
  })

  it('should render the header title when connectionState is not "connected" and editState has values', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      connectionState: 'reconnecting',
      value: {title: 'Test Value'},
      title: 'Test Title',
    } as unknown as DocumentPaneContextValue)

    mockUseValuePreview.mockReturnValue({
      ...defaultValue,
      error: undefined,
      value: {title: 'Test Value'},
    })

    const {getByText} = render(<DocumentHeaderTitle />)
    await waitFor(() => expect(getByText('Test Title')).toBeInTheDocument())
  })

  it('should return the title if it is provided', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      title: 'Test Title',
    } as unknown as DocumentPaneContextValue)

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('Test Title')).toBeInTheDocument())
  })

  it('should return "New {schemaType?.title || schemaType?.name}" if documentValue is not provided', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      editState: null,
    } as unknown as DocumentPaneContextValue)

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('New Test Schema')).toBeInTheDocument())
  })

  it('should return the value.title if value is provided and no error occurred', async () => {
    mockUseValuePreview.mockReturnValue({
      ...defaultValue,
      error: undefined,
      value: {title: 'Test Preview Value'},
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('New Test Schema')).toBeInTheDocument())
  })

  it('should return "New Test Schema" if value is not provided and no error occurred', async () => {
    mockUseValuePreview.mockReturnValue({...defaultValue, error: undefined, value: undefined})

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('New Test Schema')).toBeInTheDocument())
  })

  it('should return "Error: {error.message}" if an error occurred while getting the preview value', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      value: {title: 'Test Preview Value'},
    } as unknown as DocumentPaneContextValue)

    mockUseValuePreview.mockReturnValue({
      ...defaultValue,
      error: new Error('Test Error'),
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('Error: Test Error')).toBeInTheDocument())
  })

  it('should call useValuePreview hook with the correct arguments', async () => {
    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      value: defaultProps.editState.draft,
    } as unknown as DocumentPaneContextValue)

    render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() =>
      expect(mockUseValuePreview).toHaveBeenCalledWith({
        enabled: true,
        schemaType: defaultProps.schemaType,
        value: defaultProps.editState.draft,
      }),
    )
  })

  it('should display the value returned by useValuePreview hook correctly when no error occurs', async () => {
    mockUseValuePreview.mockReturnValue({
      ...defaultValue,
      error: undefined,
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('New Test Schema')).toBeInTheDocument())
  })
})
