import {type SanityClient} from '@sanity/client'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {Activity, type ReactNode} from 'react'
import {Observable, of, Subject} from 'rxjs'
import type * as sanity from 'sanity'
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

vi.mock('sanity', async (importOriginal) => ({
  // The real hook: the Activity cases below depend on how it compares values
  useDidUpdate: (await importOriginal<typeof sanity>()).useDidUpdate,
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

interface MockClientOptions {
  /** Replaces the default, synchronously resolving query response */
  fetch$?: Observable<{result: unknown; ms: number}>
  listen$?: Observable<unknown>
}

function createMockClient(
  initial: ClientConfig = {apiVersion: 'v2025-02-19'},
  {fetch$, listen$}: MockClientOptions = {},
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
      listen: vi.fn(() => listen$),
      observable: {
        fetch: vi.fn(() => {
          fetchConfigs.push(config)
          return fetch$ ?? of({result: [{title: 'Variant title'}], ms: 12})
        }),
      },
    } as unknown as SanityClient
  }

  return {client: create(initial), fetchConfigs}
}

/** A source that counts its subscribers, standing in for a request or a listener */
function createSource<T>() {
  const subject = new Subject<T>()
  let subscribers = 0
  const observable = new Observable<T>((subscriber) => {
    subscribers++
    const subscription = subject.subscribe(subscriber)
    return () => {
      subscribers--
      subscription.unsubscribe()
    }
  })
  return {
    observable,
    next: (value: T) => subject.next(value),
    complete: () => subject.complete(),
    get subscribers() {
      return subscribers
    },
  }
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
  clientOptions?: MockClientOptions,
) {
  const mockClient = createMockClient(undefined, clientOptions)
  sanityMocks.usePerspective.mockReturnValue(perspective)
  sanityMocks.useClient.mockReturnValue(mockClient.client)

  const tree = (mode: 'visible' | 'hidden') => (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <Activity mode={mode}>
            <VisionGui
              client={mockClient.client}
              config={{defaultApiVersion: '2025-02-19'}}
              datasets={['test']}
              projectId="test-project"
              defaultDataset="test"
            />
          </Activity>
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
  const view = render(tree('visible'))

  return {
    ...view,
    fetchConfigs: mockClient.fetchConfigs,
    hide: () => view.rerender(tree('hidden')),
    show: () => view.rerender(tree('visible')),
  }
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
      selectedVariantNames: ['french'],
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
      selectedVariantNames: ['french'],
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

describe('VisionGui inside an Activity boundary', () => {
  afterEach(() => {
    cleanup()
    // Spies on the timer globals go first, so they restore the fake and not the other way round
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  beforeEach(() => {
    localStorage.clear()
    seedVisionStorage({perspective: 'pinnedRelease', apiVersion: 'v2025-02-19'})
  })

  it('does not run the query again when the tool is hidden and shown again', async () => {
    const {fetchConfigs, hide, show} = renderVision()
    await waitFor(() => expect(fetchConfigs).toHaveLength(1))

    hide()
    show()
    await act(async () => {})

    expect(fetchConfigs).toHaveLength(1)
    expect(getPerspectiveSelector().value).toBe('pinnedRelease')
  })

  it('keeps a query that is in flight while hidden, and shows its result once shown again', async () => {
    const request = createSource<{result: unknown; ms: number}>()
    const {fetchConfigs, hide, show, unmount} = renderVision(BASE_PERSPECTIVE, {
      fetch$: request.observable,
    })
    await waitFor(() => expect(request.subscribers).toBe(1))
    expect(screen.queryByRole('button', {name: 'action.query-cancel'})).not.toBeNull()

    hide()
    expect(request.subscribers).toBe(1)
    act(() => request.next({result: [], ms: 3}))
    show()

    expect(screen.queryByRole('button', {name: 'action.query-execute'})).not.toBeNull()
    expect(fetchConfigs).toHaveLength(1)

    unmount()
    expect(request.subscribers).toBe(0)
  })

  it('keeps a listener while hidden, and cancels it when the tool unmounts', async () => {
    const listener = createSource<{type: string}>()
    const {hide, show, unmount} = renderVision(BASE_PERSPECTIVE, {listen$: listener.observable})
    fireEvent.click(screen.getByRole('button', {name: 'action.listen-execute'}))
    expect(listener.subscribers).toBe(1)

    hide()
    act(() => listener.next({type: 'mutation'}))
    expect(listener.subscribers).toBe(1)
    show()

    expect(screen.queryByRole('button', {name: 'action.listen-cancel'})).not.toBeNull()

    unmount()
    expect(listener.subscribers).toBe(0)
  })

  it('does not check for its unmount while hidden when nothing is subscribed', () => {
    vi.useFakeTimers()
    const {fetchConfigs, hide, show} = renderVision()
    // The mount run's request completed synchronously; its closed subscription does not count
    expect(fetchConfigs).toHaveLength(1)
    const timers = vi.getTimerCount()

    hide()
    expect(vi.getTimerCount()).toBe(timers)
    show()
    expect(vi.getTimerCount()).toBe(timers)
  })

  it('stops checking for its unmount once the request that was in flight completes while hidden', () => {
    vi.useFakeTimers()
    const request = createSource<{result: unknown; ms: number}>()
    const {hide} = renderVision(BASE_PERSPECTIVE, {fetch$: request.observable})
    expect(request.subscribers).toBe(1)
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    hide()
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    const check = setIntervalSpy.mock.results[0].value
    act(() => {
      request.next({result: [], ms: 3})
      request.complete()
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(clearIntervalSpy).toHaveBeenCalledWith(check)
  })

  it('cancels a listener within a second when the hidden tool was unmounted', () => {
    vi.useFakeTimers()
    const listener = createSource<{type: string}>()
    const {hide, unmount} = renderVision(BASE_PERSPECTIVE, {listen$: listener.observable})
    fireEvent.click(screen.getByRole('button', {name: 'action.listen-execute'}))

    // Unmounting a hidden boundary runs no cleanup: its effects were torn down when it hid
    hide()
    unmount()
    expect(listener.subscribers).toBe(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(listener.subscribers).toBe(0)
  })
})
