import {type SanityClient} from '@sanity/client'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {type Tool} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {writeRedesignPreference} from './redesign/redesignPreference'
import SanityVision from './SanityVision'
import {type VisionConfig} from './types'

const theme = buildTheme()

const loadedModules = vi.hoisted(() => new Set<string>())

// @sanity/ui's ToastProvider reads media queries, which jsdom does not implement
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
  useClient: () =>
    ({
      config: () => ({projectId: 'switch-project', dataset: 'test'}),
    }) as unknown as SanityClient,
  useTranslation: () => ({t: (key: string) => key}),
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'v2025-08-18'},
}))

vi.mock('./containers/VisionContainer', () => ({
  VisionContainer: ({children}: {children: (loaded: unknown) => ReactNode}) =>
    children({datasets: ['test'], projectId: 'switch-project', defaultDataset: 'test'}),
}))

vi.mock('./components/VisionGui', () => ({
  VisionGui: ({onSwitchToRedesign}: {onSwitchToRedesign?: () => void}) => (
    <div data-testid="classic-vision">
      {onSwitchToRedesign && (
        <button data-testid="classic-try-redesign" onClick={onSwitchToRedesign} type="button" />
      )}
    </div>
  ),
}))

// The factories only run when something imports the module, so they record whether the
// redesign or its WebAssembly dependency was loaded
vi.mock('./redesign/components/VisionRedesign', () => {
  loadedModules.add('VisionRedesign')
  return {VisionRedesign: () => <div data-testid="vision" />}
})

vi.mock('@sanity-labs/groq-wasm', () => {
  loadedModules.add('@sanity-labs/groq-wasm')
  return {}
})

function renderTool(options: Partial<VisionConfig>) {
  const tool = {name: 'vision', title: 'Vision', options} as unknown as Tool<VisionConfig>
  return render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <SanityVision tool={tool} />
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>,
  )
}

describe('SanityVision with the redesign switched off', () => {
  beforeEach(() => {
    localStorage.clear()
    // The preference module caches per project; start every test from a known state
    writeRedesignPreference('switch-project', {optedIn: false, dismissed: false})
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the classic tool without an invitation when the beta flag is off', () => {
    renderTool({})
    expect(screen.getByTestId('classic-vision')).toBeTruthy()
    expect(screen.queryByText('vision.redesign.toast.title')).toBeNull()
    expect(screen.queryByTestId('classic-try-redesign')).toBeNull()
  })

  it('renders the classic tool without an invitation when the beta flag is on', async () => {
    await act(async () => {
      renderTool({beta: {redesign: {enabled: true}}})
    })
    expect(screen.getByTestId('classic-vision')).toBeTruthy()
    expect(screen.queryByTestId('vision-redesign-accept')).toBeNull()
    expect(screen.queryByTestId('classic-try-redesign')).toBeNull()
  })

  it('renders the classic tool for a project that opted in before the switch-off', async () => {
    writeRedesignPreference('switch-project', {optedIn: true})
    await act(async () => {
      renderTool({beta: {redesign: {enabled: true}}})
    })
    expect(screen.getByTestId('classic-vision')).toBeTruthy()
    expect(screen.queryByTestId('vision')).toBeNull()
  })

  it('never loads the redesign or groq-wasm', async () => {
    writeRedesignPreference('switch-project', {optedIn: true})
    await act(async () => {
      renderTool({beta: {redesign: {enabled: true}}})
    })
    await vi.dynamicImportSettled()
    expect([...loadedModules]).toEqual([])
  })
})
