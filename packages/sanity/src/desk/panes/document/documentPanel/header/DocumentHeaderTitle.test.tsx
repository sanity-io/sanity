import React from 'react'
import {render} from '@testing-library/react'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentPaneContextValue} from '../../DocumentPaneContext'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'
import {unstable_useValuePreview as useValuePreview} from 'sanity'

jest.mock('../../useDocumentPane')
jest.mock('sanity')

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

  it('should render without crashing', () => {
    const {getByText} = render(<DocumentHeaderTitle />)
    expect(getByText('Untitled')).toBeInTheDocument()
  })

  it('should return an empty fragment when connectionState is not "connected"', () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      connectionState: 'connecting',
    } as unknown as DocumentPaneContextValue)
    const {container} = render(<DocumentHeaderTitle />)
    expect(container.firstChild).toBeNull()
  })

  it('should return the title if it is provided', () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      title: 'Test Title',
    } as unknown as DocumentPaneContextValue)
    const {getByText} = render(<DocumentHeaderTitle />)
    expect(getByText('Test Title')).toBeInTheDocument()
  })

  it('should return "New {schemaType?.title || schemaType?.name}" if documentValue is not provided', () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultProps,
      value: null,
    } as unknown as DocumentPaneContextValue)
    const {getByText} = render(<DocumentHeaderTitle />)
    expect(getByText('New Test Schema')).toBeInTheDocument()
  })

  it('should return the value.title if value is provided and no error occurred', () => {
    mockUseValuePreview.mockReturnValue({
      ...defaultValue,
      error: undefined,
      value: {title: 'Test Preview Value'},
    })
    const {getByText} = render(<DocumentHeaderTitle />)
    expect(getByText('Test Preview Value')).toBeInTheDocument()
  })

  it('should return "Untitled" if value is not provided and no error occurred', () => {
    mockUseValuePreview.mockReturnValue({...defaultValue, error: undefined, value: undefined})
    const {getByText} = render(<DocumentHeaderTitle />)
    expect(getByText('Untitled')).toBeInTheDocument()
  })

  it('should return "Error: {error.message}" if an error occurred while getting the preview value', () => {
    mockUseValuePreview.mockReturnValue({
      ...defaultValue,
      error: new Error('Test Error'),
      value: undefined,
    })
    const {getByText} = render(<DocumentHeaderTitle />)
    expect(getByText('Error: Test Error')).toBeInTheDocument()
  })

  it('should call useValuePreview hook with the correct arguments', () => {
    render(<DocumentHeaderTitle />)
    expect(mockUseValuePreview).toHaveBeenCalledWith({
      enabled: true,
      schemaType: defaultProps.schemaType,
      value: defaultProps.value,
    })
  })

  it('should display the value returned by useValuePreview hook correctly when no error occurs', () => {
    mockUseValuePreview.mockReturnValue({
      ...defaultValue,
      error: undefined,
      value: {title: 'Test Preview Value'},
    })
    const {getByText} = render(<DocumentHeaderTitle />)
    expect(getByText('Test Preview Value')).toBeInTheDocument()
  })
})
