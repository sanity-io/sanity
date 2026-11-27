import {type SanityClient} from '@sanity/client'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {NEVER, of} from 'rxjs'
import {type PerspectiveContextValue} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  VisionApiVersionChanged,
  VisionCopied,
  VisionDatasetChanged,
  VisionOpened,
  VisionParamsUsed,
  VisionPerspectiveChanged,
  VisionQueryCancelled,
  VisionQueryRun,
} from '../telemetry/vision.telemetry'
import {VISION_VERSION} from '../version'
import {VisionGui} from './VisionGui'

const theme = buildTheme()

const telemetry = vi.hoisted(() => ({log: vi.fn()}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => telemetry,
}))

const sanityMocks = vi.hoisted(() => ({
  usePerspective: vi.fn(),
  useClient: vi.fn(),
  // The workspace the tool runs in: variants on, as the tests of the navbar variant need
  workspace: {document: {drafts: {enabled: true}}, beta: {variants: {enabled: true}}},
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
  useWorkspace: () => sanityMocks.workspace,
  useTranslation: () => ({t: (key: string) => key}),
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'v2025-08-18'},
  getReleaseIdFromReleaseDocumentId: (id: string) => id.replace(/^_.releases./, ''),
  isCardinalityOneRelease: () => false,
  sortReleases: <T,>(releases: T[]) => releases,
  getDefaultVariant: <T,>(selected?: readonly T[]) => selected?.[0],
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
  selectedVariantNames: [],
  selectedVariants: [],
  // oxlint-disable-next-line typescript/no-deprecated -- fixture fills the deprecated first-variant alias
  selectedVariantName: undefined,
  // oxlint-disable-next-line typescript/no-deprecated -- fixture fills the deprecated first-variant alias
  selectedVariant: undefined,
  bundle: 'published',
}

const VISION_STORAGE_KEY = 'sanityVision:test-project'

type ClientConfig = Record<string, unknown>

function createMockClient(
  initial: ClientConfig = {apiVersion: 'v2025-02-19'},
  options: {hangFetch?: boolean} = {},
): {
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
          if (options.hangFetch) {
            return NEVER
          }
          return of({result: [{title: 'Variant title'}], ms: 12})
        }),
      },
      listen: vi.fn(() => ({subscribe: () => ({unsubscribe: vi.fn()})})),
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

function renderVision(
  perspective: PerspectiveContextValue = BASE_PERSPECTIVE,
  options: {datasets?: string[]; hangFetch?: boolean} = {},
) {
  const mockClient = createMockClient({apiVersion: 'v2025-02-19'}, {hangFetch: options.hangFetch})
  sanityMocks.usePerspective.mockReturnValue(perspective)
  sanityMocks.useClient.mockReturnValue(mockClient.client)

  const view = render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <VisionGui
            client={mockClient.client}
            config={{defaultApiVersion: '2025-02-19'}}
            datasets={options.datasets ?? ['test']}
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
    telemetry.log.mockClear()
    sanityMocks.usePerspective.mockReturnValue(BASE_PERSPECTIVE)
    sanityMocks.workspace = {document: {drafts: {enabled: true}}, beta: {variants: {enabled: true}}}
  })

  it('does not attach a variant where the workspace has variants switched off', async () => {
    // The same flag the studio hides its own variant UI behind, the navbar's selector included
    sanityMocks.workspace = {
      document: {drafts: {enabled: true}},
      beta: {variants: {enabled: false}},
    }
    seedVisionStorage({perspective: 'pinnedRelease', apiVersion: 'v2025-02-19'})

    // A variant the URL still carries for the navbar is not one the studio shows
    const {fetchConfigs} = renderVision({
      ...BASE_PERSPECTIVE,
      selectedVariantNames: ['french'],
    })

    expect(getPerspectiveSelector().value).toBe('pinnedRelease')
    // Nothing locks the API version to vX
    expect(getApiVersionSelector().value).toBe('v2025-02-19')
    expect(getApiVersionSelector().disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', {name: 'action.query-execute'}))

    await waitFor(() => {
      expect(getQueryUrl()).toContain('/v2025-02-19/')
      expect(getQueryUrlParams().get('variant')).toBeNull()
      expect(getQueryUrlParams().get('perspective')).toBe('published')
    })

    expect(fetchConfigs.at(-1)).toEqual(
      expect.objectContaining({apiVersion: 'v2025-02-19', perspective: ['published']}),
    )
    expect(fetchConfigs.at(-1)?.variant).toBeUndefined()
  })

  it('switches to pinned release and locks the variants version when the navbar has a variant', async () => {
    seedVisionStorage({apiVersion: 'v2025-02-19'})

    const {fetchConfigs} = renderVision({
      ...BASE_PERSPECTIVE,
      selectedVariantNames: ['french'],
    })

    await waitFor(() => {
      expect(getPerspectiveSelector().value).toBe('pinnedRelease')
      expect(getApiVersionSelector().value).toBe('v2025-08-18')
      expect(getApiVersionSelector().disabled).toBe(true)
    })

    await waitFor(() => {
      expect(getQueryUrl()).toContain('/v2025-08-18/')
      expect(getQueryUrlParams().get('variant')).toBe('french')
      expect(getQueryUrlParams().get('perspective')).toBe('published')
    })

    expect(fetchConfigs.at(-1)).toEqual(
      expect.objectContaining({
        apiVersion: 'v2025-08-18',
        perspective: ['published'],
        variant: 'french',
      }),
    )
  })

  it('forces the variants version over a stored custom API version when a navbar variant is active', async () => {
    seedVisionStorage({
      perspective: 'pinnedRelease',
      apiVersion: 'v2022-08-08',
    })

    const {fetchConfigs} = renderVision({
      ...BASE_PERSPECTIVE,
      selectedVariantNames: ['french'],
    })

    expect(getApiVersionSelector().value).toBe('v2025-08-18')
    expect(getApiVersionSelector().disabled).toBe(true)
    expect(screen.queryByDisplayValue('v2022-08-08')).toBeNull()

    await waitFor(() => {
      expect(getQueryUrl()).toContain('/v2025-08-18/')
      expect(getQueryUrlParams().get('variant')).toBe('french')
    })

    expect(fetchConfigs.at(-1)?.apiVersion).toBe('v2025-08-18')
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
      selectedVariantNames: ['french'],
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
      selectedVariantNames: ['french'],
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

const NO_STACK: PerspectiveContextValue = {
  ...BASE_PERSPECTIVE,
  perspectiveStack: [],
  selectedPerspective: 'drafts',
  selectedPerspectiveName: undefined,
}

function events(name: string) {
  return telemetry.log.mock.calls.filter((call) => call[0]?.name === name)
}

function withVisionVersion<Data extends object>(data: Data) {
  return {...data, visionVersion: VISION_VERSION}
}

describe('VisionGui adoption telemetry', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
    telemetry.log.mockClear()
    // oxlint-disable-next-line typescript/no-deprecated -- the copy button still calls execCommand
    document.execCommand = vi.fn(() => true)
    sanityMocks.usePerspective.mockReturnValue(NO_STACK)
    sanityMocks.workspace = {document: {drafts: {enabled: true}}, beta: {variants: {enabled: true}}}
  })

  it('records one fetch, and params only when the run sent some', () => {
    seedVisionStorage({
      query: '*[_id == $id]',
      params: '{"id":"book-1"}',
      apiVersion: 'v2025-02-19',
    })
    renderVision(NO_STACK)
    telemetry.log.mockClear()

    fireEvent.click(screen.getByRole('button', {name: 'action.query-execute'}))

    expect(events('Vision Query Run')).toEqual([
      [VisionQueryRun, withVisionVersion({mode: 'fetch', trigger: 'button', hasParams: true})],
    ])
    expect(events('Vision Params Used')).toEqual([
      [VisionParamsUsed, withVisionVersion({mode: 'fetch'})],
    ])
  })

  it('records a fetch without parameters once, and not a params event', () => {
    seedVisionStorage({query: '*[_type == "book"]', params: '{}', apiVersion: 'v2025-02-19'})
    renderVision(NO_STACK)
    telemetry.log.mockClear()

    fireEvent.click(screen.getByRole('button', {name: 'action.query-execute'}))

    expect(events('Vision Query Run')).toEqual([
      [VisionQueryRun, withVisionVersion({mode: 'fetch', trigger: 'button', hasParams: false})],
    ])
    expect(events('Vision Params Used')).toEqual([])
  })

  it('records cancelling an in-flight fetch', () => {
    seedVisionStorage({query: '*[_type == "book"]', params: '{}', apiVersion: 'v2025-02-19'})
    renderVision(NO_STACK, {hangFetch: true})
    telemetry.log.mockClear()

    fireEvent.click(screen.getByRole('button', {name: 'action.query-execute'}))
    fireEvent.click(screen.getByRole('button', {name: 'action.query-cancel'}))

    expect(events('Vision Query Cancelled')).toEqual([
      [VisionQueryCancelled, withVisionVersion({mode: 'fetch'})],
    ])
  })

  it('records the keyboard shortcut as its own trigger, still once', () => {
    seedVisionStorage({query: '*[_type == "book"]', params: '{}', apiVersion: 'v2025-02-19'})
    renderVision(NO_STACK)
    telemetry.log.mockClear()

    fireEvent.keyDown(screen.getByTestId('vision-root'), {
      key: 'Enter',
      ctrlKey: true,
      keyCode: 13,
      which: 13,
    })

    expect(events('Vision Query Run')).toEqual([
      [VisionQueryRun, withVisionVersion({mode: 'fetch', trigger: 'shortcut', hasParams: false})],
    ])
  })

  it('records opening the classic tool once on mount', () => {
    seedVisionStorage({query: '*[_type == "book"]', params: '{}', apiVersion: 'v2025-02-19'})
    renderVision(NO_STACK)

    expect(events('Vision Opened')).toEqual([[VisionOpened, withVisionVersion({ui: 'classic'})]])
  })

  it('records one listen, and records cancelling it separately', () => {
    seedVisionStorage({query: '*[_type == "book"]', params: '{}', apiVersion: 'v2025-02-19'})
    renderVision(NO_STACK)
    telemetry.log.mockClear()

    const listen = screen.getByRole('button', {name: 'action.listen-execute'})
    fireEvent.click(listen)
    fireEvent.click(screen.getByRole('button', {name: 'action.listen-cancel'}))

    expect(events('Vision Query Run')).toEqual([
      [VisionQueryRun, withVisionVersion({mode: 'listen', trigger: 'button', hasParams: false})],
    ])
    expect(events('Vision Query Cancelled')).toEqual([
      [VisionQueryCancelled, withVisionVersion({mode: 'listen'})],
    ])
  })

  it('does not record a fetch that never starts', () => {
    seedVisionStorage({query: '   ', params: '{}', apiVersion: 'v2025-02-19'})
    renderVision(NO_STACK)
    telemetry.log.mockClear()

    fireEvent.click(screen.getByRole('button', {name: 'action.query-execute'}))

    expect(telemetry.log).not.toHaveBeenCalled()
  })

  it('records a dataset, perspective, or API version change once, and not as a query run', () => {
    seedVisionStorage({
      query: '*[_type == "book"]',
      params: '{}',
      dataset: 'test',
      perspective: 'raw',
      apiVersion: 'v2025-02-19',
    })
    renderVision(NO_STACK, {datasets: ['test', 'staging']})
    telemetry.log.mockClear()

    fireEvent.change(screen.getAllByRole('combobox')[0], {target: {value: 'staging'}})
    expect(events('Vision Dataset Changed')).toEqual([
      [VisionDatasetChanged, withVisionVersion({})],
    ])

    fireEvent.change(getPerspectiveSelector(), {target: {value: 'published'}})
    expect(events('Vision Perspective Changed')).toEqual([
      [VisionPerspectiveChanged, withVisionVersion({})],
    ])

    fireEvent.change(getApiVersionSelector(), {target: {value: 'v1'}})
    expect(events('Vision API Version Changed')).toEqual([
      [VisionApiVersionChanged, withVisionVersion({custom: false})],
    ])

    fireEvent.change(getApiVersionSelector(), {target: {value: 'other'}})
    expect(events('Vision API Version Changed')).toHaveLength(1)

    const customVersion = screen.getByDisplayValue('v')
    fireEvent.change(customVersion, {target: {value: 'v2021-03-25'}})
    fireEvent.change(customVersion, {target: {value: 'v2021-03-25'}})
    expect(events('Vision API Version Changed')).toEqual([
      [VisionApiVersionChanged, withVisionVersion({custom: false})],
      [VisionApiVersionChanged, withVisionVersion({custom: true})],
    ])

    expect(events('Vision Query Run')).toEqual([])
  })

  it('records one copy of the query URL', async () => {
    seedVisionStorage({query: '*[_type == "book"]', params: '{}', apiVersion: 'v2025-02-19'})
    renderVision(NO_STACK)

    fireEvent.click(screen.getByRole('button', {name: 'action.query-execute'}))
    telemetry.log.mockClear()

    fireEvent.click(await screen.findByRole('button', {name: 'action.copy-url-to-clipboard'}))

    expect(events('Vision Copied')).toEqual([[VisionCopied, withVisionVersion({target: 'url'})]])
  })
})
