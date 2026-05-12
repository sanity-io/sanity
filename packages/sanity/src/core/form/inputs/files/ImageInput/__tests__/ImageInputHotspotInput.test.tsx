import {type ImageUrlBuilder} from '@sanity/image-url'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, type RenderResult, screen} from '@testing-library/react'
import {type ReactElement} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ImageInputHotspotInput} from '../ImageInputHotspotInput'
import {useImageUrl} from '../useImageUrl'

vi.mock('../useImageUrl')

vi.mock('../../ImageToolInput', () => ({
  ImageToolInput: (props: {imageUrl: string}) => (
    <div data-testid="image-tool-input" data-image-url={props.imageUrl} />
  ),
}))

const assetRef = {_ref: 'image-abc-100x100-jpg', _type: 'reference'}

const imageUrlBuilder = {} as ImageUrlBuilder

const baseProps = {
  handleCloseDialog: vi.fn(),
  inputProps: {presence: []} as any,
  imageInputProps: {
    id: 'mainImage',
    imageUrlBuilder,
    value: {_type: 'image', asset: assetRef},
    changed: false,
  } as any,
  isImageToolEnabled: true,
}

function renderWithTheme(ui: ReactElement): RenderResult {
  return render(<ThemeProvider theme={studioTheme}>{ui}</ThemeProvider>)
}

describe('ImageInputHotspotInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes the asset reference (not the full image value) to useImageUrl', () => {
    vi.mocked(useImageUrl).mockReturnValue({url: 'https://cdn/x.jpg', isLoading: false})

    renderWithTheme(<ImageInputHotspotInput {...baseProps} accessPolicy="public" />)

    expect(useImageUrl).toHaveBeenCalledWith({
      accessPolicy: 'public',
      imageSource: assetRef,
      imageUrlBuilder,
    })
  })

  it('skips the fetch when image tool is disabled', () => {
    vi.mocked(useImageUrl).mockReturnValue({url: 'https://cdn/x.jpg', isLoading: false})

    renderWithTheme(
      <ImageInputHotspotInput {...baseProps} accessPolicy="private" isImageToolEnabled={false} />,
    )

    expect(useImageUrl).toHaveBeenCalledWith({
      accessPolicy: 'private',
      imageSource: undefined,
      imageUrlBuilder,
    })
    expect(screen.queryByTestId('image-tool-input')).not.toBeInTheDocument()
  })

  it.each([
    ['loading', {url: undefined, isLoading: true}],
    ['no url available', {url: undefined, isLoading: false}],
  ])('renders LoadingBlock when %s', (_label, hookResult) => {
    vi.mocked(useImageUrl).mockReturnValue(hookResult)

    renderWithTheme(<ImageInputHotspotInput {...baseProps} accessPolicy="private" />)

    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
    expect(screen.queryByTestId('image-tool-input')).not.toBeInTheDocument()
  })

  it('renders ImageToolInput with the resolved url once available', () => {
    const url = 'blob:https://studio/private-asset'
    vi.mocked(useImageUrl).mockReturnValue({url, isLoading: false})

    renderWithTheme(<ImageInputHotspotInput {...baseProps} accessPolicy="private" />)

    expect(screen.getByTestId('image-tool-input')).toHaveAttribute('data-image-url', url)
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })
})
