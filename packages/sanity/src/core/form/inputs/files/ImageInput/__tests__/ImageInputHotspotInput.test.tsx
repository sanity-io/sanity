import {type ImageUrlBuilder} from '@sanity/image-url'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, type RenderResult, screen} from '@testing-library/react'
import {type ReactElement} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ImageInputHotspotInput} from '../ImageInputHotspotInput'
import {useImageUrl} from '../useImageUrl'

function renderWithTheme(ui: ReactElement): RenderResult {
  return render(<ThemeProvider theme={studioTheme}>{ui}</ThemeProvider>)
}

vi.mock('../useImageUrl')

vi.mock('../../../../../../ui-components', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    Dialog: ({children}: {children: React.ReactNode}) => (
      <div data-testid="hotspot-dialog">{children}</div>
    ),
  }
})

vi.mock('../../../../../presence', () => ({
  PresenceOverlay: ({children}: {children: React.ReactNode}) => <>{children}</>,
}))

vi.mock('../../../../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../../ImageToolInput', () => ({
  ImageToolInput: (props: {imageUrl: string}) => (
    <div data-testid="image-tool-input" data-image-url={props.imageUrl} />
  ),
}))

vi.mock('../../../../../components/loadingBlock', () => ({
  LoadingBlock: () => <div data-testid="loading-block" />,
}))

const assetRef = {_ref: 'image-abc-100x100-jpg', _type: 'reference' as const}

const baseValue = {
  _type: 'image',
  asset: assetRef,
}

const imageUrlBuilder = {
  image: vi.fn().mockReturnThis(),
  url: vi.fn().mockReturnValue('https://cdn.sanity.io/asset.jpg'),
} as unknown as ImageUrlBuilder

const baseImageInputProps = {
  id: 'mainImage',
  imageUrlBuilder,
  value: baseValue,
  changed: false,
} as any

const baseInputProps = {presence: []} as any

const baseProps = {
  handleCloseDialog: vi.fn(),
  imageInputProps: baseImageInputProps,
  inputProps: baseInputProps,
  isImageToolEnabled: true,
}

describe('ImageInputHotspotInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes accessPolicy, image value, and url builder to useImageUrl', () => {
    vi.mocked(useImageUrl).mockReturnValue({
      url: 'https://cdn.sanity.io/asset.jpg',
      isLoading: false,
    })

    renderWithTheme(<ImageInputHotspotInput {...baseProps} accessPolicy="public" />)

    expect(useImageUrl).toHaveBeenCalledWith({
      accessPolicy: 'public',
      imageSource: baseValue,
      imageUrlBuilder,
    })
  })

  it('renders a LoadingBlock while the image url is resolving', () => {
    vi.mocked(useImageUrl).mockReturnValue({url: undefined, isLoading: true})

    renderWithTheme(<ImageInputHotspotInput {...baseProps} accessPolicy="checking" />)

    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
    expect(screen.queryByTestId('image-tool-input')).not.toBeInTheDocument()
  })

  it('renders a LoadingBlock when there is no url even if not loading', () => {
    vi.mocked(useImageUrl).mockReturnValue({url: undefined, isLoading: false})

    renderWithTheme(<ImageInputHotspotInput {...baseProps} accessPolicy="private" />)

    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
    expect(screen.queryByTestId('image-tool-input')).not.toBeInTheDocument()
  })

  it('renders ImageToolInput with the resolved url once available', () => {
    const url = 'blob:https://studio.sanity.io/private-asset'
    vi.mocked(useImageUrl).mockReturnValue({url, isLoading: false})

    renderWithTheme(<ImageInputHotspotInput {...baseProps} accessPolicy="private" />)

    const tool = screen.getByTestId('image-tool-input')
    expect(tool).toBeInTheDocument()
    expect(tool).toHaveAttribute('data-image-url', url)
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })

  it('does not render the ImageToolInput when image tool is disabled', () => {
    vi.mocked(useImageUrl).mockReturnValue({
      url: 'https://cdn.sanity.io/asset.jpg',
      isLoading: false,
    })

    renderWithTheme(
      <ImageInputHotspotInput {...baseProps} accessPolicy="public" isImageToolEnabled={false} />,
    )

    expect(screen.queryByTestId('image-tool-input')).not.toBeInTheDocument()
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })
})
