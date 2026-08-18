import {type SanityClient} from '@sanity/client'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {type PerspectiveContextValue} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {VisionGui} from './VisionGui'

const theme = buildTheme()

const sanityMocks = vi.hoisted(() => ({
  usePerspective: vi.fn(),
  useClient: vi.fn(),
}))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
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

vi.mock('sanity', () => ({
  usePerspective: sanityMocks.usePerspective,
  useClient: sanityMocks.useClient,
  useActiveReleases: vi.fn(() => ({data: [], loading: false})),
  useScheduledDraftsEnabled: vi.fn(() => false),
  useWorkspace: vi.fn(() => ({document: {drafts: {enabled: true}}})),
  useTranslation: () => ({t: (key: string) => key}),
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'X'},
  getReleaseIdFromReleaseDocumentId: (id: string) => id.replace(/^_.releases./, ''),
  isCardinalityOneRelease: () => false,
  sortReleases: <T,>(releases: T[]) => releases,
}))

vi.mock('./QueryRecall', () => ({
  QueryRecall: () => null,
}))

vi.mock('./PerspectivePopover', () => ({
  PerspectivePopover: () => null,
}))

vi.mock('./VisionGuiResult', () => ({
  VisionGuiResult: () => null,
}))

vi.mock('../codemirror/VisionCodeMirror', () => ({
  VisionCodeMirror: function VisionCodeMirrorMock({
    initialValue,
    onChange,
  }: {
    initialValue?: string
    onChange?: (value: string) => void
  }) {
    return (
      <textarea
        data-testid="vision-codemirror-mock"
        defaultValue={initialValue}
        onChange={(event) => onChange?.(event.target.value)}
      />
    )
  },
}))

vi.mock('@rexxars/react-split-pane', () => ({
  SplitPane: function SplitPaneMock({children}: {children: ReactNode}) {
    return <div>{children}</div>
  },
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

const VISION_STORAGE_KEY = 'sanityVision:test-project'

type ClientConfig = Record<string, unknown>

function createMockClient(initial: ClientConfig = {apiVersion: 'v2025-02-19'}): {
  client: SanityClient
  fetchConfigs: ClientConfig[]
} {
  const fetchConfigs: ClientConfig[] = []

  const create = (config: ClientConfig): SanityClient => {
    return {
      withConfig: (next: ClientConfig) => create({...config, ...next}),
      getDataUrl: (_op: string, qs: string) => `query${qs}`,
      getUrl: (path: string) =>
        `https://api.sanity.io/${String(config.apiVersion ?? 'v1')}/data/${path}`,
      observable: {
        fetch: vi.fn(() => {
          fetchConfigs.push(config)
          return of({result: [{title: 'Variant title'}], ms: 12})
        }),
      },
    } as unknown as SanityClient
  }

  return {client: create(initial), fetchConfigs}
}

function seedVisionStorage(state: Record<string, unknown>) {
  localStorage.setItem(
    VISION_STORAGE_KEY,
    JSON.stringify({
      query: '*[_id == $id]',
      params: '{"id":"book-1"}',
      dataset: 'test',
      ...state,
    }),
  )
}

function renderVision(perspective: PerspectiveContextValue = BASE_PERSPECTIVE) {
  const mockClient = createMockClient()
  sanityMocks.usePerspective.mockReturnValue(perspective)
  sanityMocks.useClient.mockReturnValue(mockClient.client)

  const view = render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <VisionGui
            client={mockClient.client}
            config={{defaultApiVersion: '2025-02-19'}}
            datasets={['test']}
            projectId="test-project"
            defaultDataset="test"
          />
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>,
  )

  return {...view, fetchConfigs: mockClient.fetchConfigs}
}

function getQueryUrl(): string {
  return (screen.getByTestId('vision-query-url') as HTMLInputElement).value
}

function getQueryUrlParams(): URLSearchParams {
  return new URL(getQueryUrl()).searchParams
}

function getApiVersionSelector(): HTMLSelectElement {
  return screen.getByTestId('api-version-selector') as HTMLSelectElement
}

function getPerspectiveSelector(): HTMLSelectElement {
  return screen.getByTestId('perspective-selector') as HTMLSelectElement
}

describe('VisionGui pinned release and variant', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
    sanityMocks.usePerspective.mockReturnValue(BASE_PERSPECTIVE)
  })

  it('switches to pinned release and locks vX when the navbar has a variant', async () => {
    seedVisionStorage({apiVersion: 'v2025-02-19'})

    const {fetchConfigs} = renderVision({
      ...BASE_PERSPECTIVE,
      selectedVariantName: 'french',
    })

    await waitFor(() => {
      expect(getPerspectiveSelector().value).toBe('pinnedRelease')
      expect(getApiVersionSelector().value).toBe('vX')
      expect(getApiVersionSelector().disabled).toBe(true)
    })

    await waitFor(() => {
      expect(getQueryUrl()).toContain('/vX/')
      expect(getQueryUrlParams().get('variant')).toBe('french')
      expect(getQueryUrlParams().get('perspective')).toBe('published')
    })

    expect(fetchConfigs.at(-1)).toEqual(
      expect.objectContaining({
        apiVersion: 'vX',
        perspective: ['published'],
        variant: 'french',
      }),
    )
  })

  it('forces vX over a stored custom API version when a navbar variant is active', async () => {
    seedVisionStorage({
      perspective: 'pinnedRelease',
      apiVersion: 'v2022-08-08',
    })

    const {fetchConfigs} = renderVision({
      ...BASE_PERSPECTIVE,
      selectedVariantName: 'french',
    })

    expect(getApiVersionSelector().value).toBe('vX')
    expect(getApiVersionSelector().disabled).toBe(true)
    expect(screen.queryByDisplayValue('v2022-08-08')).toBeNull()

    await waitFor(() => {
      expect(getQueryUrl()).toContain('/vX/')
      expect(getQueryUrlParams().get('variant')).toBe('french')
    })

    expect(fetchConfigs.at(-1)?.apiVersion).toBe('vX')
  })

  it('does not attach a variant while Vision is on a local perspective', async () => {
    seedVisionStorage({
      perspective: 'raw',
      apiVersion: 'v2025-02-19',
    })

    const {fetchConfigs} = renderVision({
      ...BASE_PERSPECTIVE,
      perspectiveStack: [],
      selectedPerspectiveName: undefined,
      selectedPerspective: 'drafts',
      selectedVariantName: 'french',
    })

    expect(getPerspectiveSelector().value).toBe('raw')
    expect(getApiVersionSelector().disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', {name: 'action.query-execute'}))

    await waitFor(() => {
      expect(getQueryUrlParams().get('perspective')).toBe('raw')
      expect(getQueryUrlParams().get('variant')).toBeNull()
    })

    expect(fetchConfigs.at(-1)).toEqual(
      expect.objectContaining({
        perspective: 'raw',
      }),
    )
    expect(fetchConfigs.at(-1)?.variant).toBeUndefined()
  })

  it('drops variant from the query URL after switching away from pinned release', async () => {
    seedVisionStorage({
      perspective: 'pinnedRelease',
      apiVersion: 'v2025-02-19',
    })

    const {fetchConfigs} = renderVision({
      ...BASE_PERSPECTIVE,
      selectedVariantName: 'french',
    })

    await waitFor(() => {
      expect(getQueryUrlParams().get('variant')).toBe('french')
    })

    fireEvent.change(getPerspectiveSelector(), {target: {value: 'raw'}})

    await waitFor(() => {
      expect(getPerspectiveSelector().value).toBe('raw')
      expect(getApiVersionSelector().disabled).toBe(false)
      expect(getQueryUrlParams().get('variant')).toBeNull()
    })

    expect(fetchConfigs.at(-1)?.variant).toBeUndefined()
    expect(fetchConfigs.at(-1)?.perspective).toBe('raw')
  })

  it('sends the navbar release stack without a variant when none is selected', async () => {
    seedVisionStorage({
      perspective: 'pinnedRelease',
      apiVersion: 'v2025-02-19',
    })

    const {fetchConfigs} = renderVision({
      ...BASE_PERSPECTIVE,
      perspectiveStack: ['rSummer', 'drafts'],
      selectedPerspectiveName: 'rSummer',
      selectedReleaseId: 'rSummer',
    })

    await waitFor(() => {
      expect(getQueryUrlParams().get('perspective')).toBe('rSummer,drafts')
      expect(getQueryUrlParams().get('variant')).toBeNull()
    })

    expect(getApiVersionSelector().disabled).toBe(false)
    expect(fetchConfigs.at(-1)).toEqual(
      expect.objectContaining({
        perspective: ['rSummer', 'drafts'],
      }),
    )
    expect(fetchConfigs.at(-1)?.variant).toBeUndefined()
  })
})
