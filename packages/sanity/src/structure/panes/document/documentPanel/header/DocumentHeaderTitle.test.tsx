import React from 'react'
import {render, waitFor} from '@testing-library/react'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentPaneContextValue} from '../../DocumentPaneContext'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'
import {SanityClient, defineConfig, unstable_useValuePreview as useValuePreview} from 'sanity'

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

jest.mock('../../useDocumentPane')
jest.mock('sanity', () => {
  const actual = jest.requireActual('sanity')
  return {
    ...actual,
    unstable_useValuePreview: jest.fn(),
  }
})

describe('DocumentHeaderTitle', () => {
  const mockUseDocumentPane = useDocumentPane as jest.MockedFunction<typeof useDocumentPane>
  const mockUseValuePreview = useValuePreview as jest.MockedFunction<typeof useValuePreview>

  const defaultProps = {
    connectionState: 'connected',
    schemaType: {title: 'Test Schema', name: 'testSchema'},
    value: {title: 'Test Value'},
  }

  const defaultValue = {
    isLoading: false,
  }

  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue(defaultProps as unknown as DocumentPaneContextValue)
    mockUseValuePreview.mockReturnValue({...defaultValue, error: undefined, value: undefined})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render without crashing', async () => {
    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('Untitled')).toBeInTheDocument())
  })

  it('should return an empty fragment when connectionState is not "connected"', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      connectionState: 'connecting',
    } as unknown as DocumentPaneContextValue)

    const {container} = render(<DocumentHeaderTitle />)
    await waitFor(() => expect(container.firstChild).toBeNull())
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
      value: null,
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
    await waitFor(() => expect(getByText('Test Preview Value')).toBeInTheDocument())
  })

  it('should return "Untitled" if value is not provided and no error occurred', async () => {
    mockUseValuePreview.mockReturnValue({...defaultValue, error: undefined, value: undefined})

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('Untitled')).toBeInTheDocument())
  })

  it('should return "Error: {error.message}" if an error occurred while getting the preview value', async () => {
    mockUseValuePreview.mockReturnValue({
      ...defaultValue,
      error: new Error('Test Error'),
      value: undefined,
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('Error: Test Error')).toBeInTheDocument())
  })

  it('should call useValuePreview hook with the correct arguments', async () => {
    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() =>
      expect(mockUseValuePreview).toHaveBeenCalledWith({
        enabled: true,
        schemaType: defaultProps.schemaType,
        value: defaultProps.value,
      }),
    )
  })

  it('should display the value returned by useValuePreview hook correctly when no error occurs', async () => {
    mockUseValuePreview.mockReturnValue({
      ...defaultValue,
      error: undefined,
      value: {title: 'Test Preview Value'},
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {getByText} = render(<DocumentHeaderTitle />, {wrapper})
    await waitFor(() => expect(getByText('Test Preview Value')).toBeInTheDocument())
  })
})
