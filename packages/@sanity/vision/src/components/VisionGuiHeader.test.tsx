import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, render, screen} from '@testing-library/react'
import {type PerspectiveContextValue} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type SupportedPerspective} from '../perspectives'
import {type VisionGuiHeaderProps, VisionGuiHeader} from './VisionGuiHeader'

const theme = buildTheme()

const sanityMocks = vi.hoisted(() => ({
  usePerspective: vi.fn(),
}))

vi.mock('sanity', () => ({
  usePerspective: sanityMocks.usePerspective,
  useTranslation: () => ({t: (key: string) => key}),
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  getVariantTitle: (variant: {metadata?: {title?: string}; _id: string}) => {
    const title = variant.metadata?.title
    return typeof title === 'string' && title.trim()
      ? title
      : variant._id.replace(/^_\.variants\./, '')
  },
}))

vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

vi.mock('./PerspectivePopover', () => ({
  PerspectivePopover: () => null,
}))

const BASE_PERSPECTIVE: PerspectiveContextValue = {
  perspectiveStack: ['published'],
  excludedPerspectives: [],
  selectedPerspective: 'published',
  selectedPerspectiveName: 'published',
  selectedReleaseId: undefined,
  selectedVariantName: undefined,
  selectedVariant: undefined,
  bundle: 'published',
}

const headerProps: Omit<VisionGuiHeaderProps, 'perspective'> = {
  onChangeDataset: vi.fn(),
  dataset: 'test',
  datasets: ['test'],
  customApiVersion: false,
  apiVersion: 'vX',
  onChangeApiVersion: vi.fn(),
  customApiVersionElementRef: {current: null},
  onCustomApiVersionChange: vi.fn(),
  isValidApiVersion: true,
  onChangePerspective: vi.fn(),
  url: 'https://api.sanity.io/vX/data/query/test?query=*&variant=french',
  isScheduledDraftsEnabled: false,
}

function renderHeader(
  perspective: SupportedPerspective,
  pinnedPerspective: PerspectiveContextValue = BASE_PERSPECTIVE,
  props: Partial<VisionGuiHeaderProps> = {},
) {
  sanityMocks.usePerspective.mockReturnValue(pinnedPerspective)
  return render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <VisionGuiHeader {...headerProps} {...props} perspective={perspective} />
      </LayerProvider>
    </ThemeProvider>,
  )
}

function getApiVersionSelector(): HTMLSelectElement {
  return screen.getByTestId('api-version-selector') as HTMLSelectElement
}

function getQueryUrl(): string {
  return (screen.getByTestId('vision-query-url') as HTMLInputElement).value
}

describe('VisionGuiHeader variant lock', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    sanityMocks.usePerspective.mockReturnValue(BASE_PERSPECTIVE)
  })

  it('locks the API version selector to vX when pinned release has a variant', () => {
    renderHeader('pinnedRelease', {
      ...BASE_PERSPECTIVE,
      selectedVariantName: 'french',
    })

    const selector = getApiVersionSelector()
    expect(selector.value).toBe('vX')
    expect(selector.disabled).toBe(true)
    expect(screen.queryByLabelText('settings.custom-api-version-label')).toBeNull()
  })

  it('does not lock the API version for a variant when Vision is on a local perspective', () => {
    renderHeader('raw', {
      ...BASE_PERSPECTIVE,
      selectedVariantName: 'french',
    })

    expect(getApiVersionSelector().disabled).toBe(false)
  })

  it('hides the custom API version input while a variant lock is active', () => {
    renderHeader(
      'pinnedRelease',
      {
        ...BASE_PERSPECTIVE,
        selectedVariantName: 'french',
      },
      {customApiVersion: 'v2022-08-08', apiVersion: 'v2022-08-08'},
    )

    expect(getApiVersionSelector().disabled).toBe(true)
    expect(screen.queryByDisplayValue('v2022-08-08')).toBeNull()
  })

  it('shows the variant title on the pinned release option', () => {
    renderHeader('pinnedRelease', {
      ...BASE_PERSPECTIVE,
      selectedVariantName: 'french',
      selectedVariant: {
        _id: '_.variants.french',
        _type: 'system.variant',
        _rev: '1',
        _createdAt: '2026-01-01T00:00:00.000Z',
        _updatedAt: '2026-01-01T00:00:00.000Z',
        name: 'french',
        conditions: {},
        priority: 0,
        metadata: {title: 'French'},
      },
    })

    const option = screen.getByRole('option', {name: /French/})
    expect(option.getAttribute('value')).toBe('pinnedRelease')
  })

  it('exposes the variant lock tooltip copy', () => {
    renderHeader('pinnedRelease', {
      ...BASE_PERSPECTIVE,
      selectedVariantName: 'french',
    })

    expect(screen.getByTestId('api-version-selector-wrap')).toBeTruthy()
    expect(screen.getByText('settings.api-version-locked-for-variant')).toBeTruthy()
  })

  it('renders the copyable query URL with vX and the variant', () => {
    renderHeader('pinnedRelease', {
      ...BASE_PERSPECTIVE,
      selectedVariantName: 'french',
    })

    const url = getQueryUrl()
    expect(url).toContain('/vX/')
    expect(new URL(url).searchParams.get('variant')).toBe('french')
  })
})
