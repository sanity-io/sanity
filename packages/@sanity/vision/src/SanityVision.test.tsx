import {type SanityClient} from '@sanity/client'
import {createSanityInstance} from '@sanity/sdk'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {type Tool} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  getLocalPreferenceKey,
  type VisionPreferenceName,
} from './redesign/preferences/visionPreferences'
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

// A real instance: the SDK does not declare Vision's keys yet, so they fall back to localStorage
const sdkInstance = createSanityInstance({projectId: 'switch-project', dataset: 'test'})
vi.mock('@sanity/sdk-react', () => ({useSanityInstance: () => sdkInstance}))

vi.mock('sanity', () => ({
  useCurrentUser: () => ({id: 'user-1'}),
  useClient: () =>
    ({
      config: () => ({projectId: 'switch-project', dataset: 'test'}),
    }) as unknown as SanityClient,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'v2025-08-18'},
}))
vi.mock('sanity/i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
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

vi.mock('./redesign/components/VisionRedesign', () => ({
  VisionRedesign: ({onSwitchToClassic}: {onSwitchToClassic: () => void}) => (
    <button data-testid="vision" onClick={onSwitchToClassic} type="button">
      Vision
    </button>
  ),
}))

// The factories run only when something imports the package. The redesign must not import it.
vi.mock('@sanity-labs/groq-wasm', () => {
  loadedModules.add('@sanity-labs/groq-wasm')
  return {}
})
vi.mock('@sanity-labs/groq-wasm/lazy', () => {
  loadedModules.add('@sanity-labs/groq-wasm/lazy')
  return {}
})

function storePreference(name: VisionPreferenceName, value: unknown) {
  localStorage.setItem(getLocalPreferenceKey(name, 'switch-project'), JSON.stringify(value))
}

function readPreference(name: VisionPreferenceName): unknown {
  return JSON.parse(localStorage.getItem(getLocalPreferenceKey(name, 'switch-project')) || 'null')
}

// Untyped options, so a test can pass keys VisionConfig no longer declares
function renderTool(options: object) {
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

describe('SanityVision experience switch', () => {
  beforeEach(() => {
    loadedModules.clear()
    localStorage.clear()
  })

  afterEach(async () => {
    cleanup()
    await vi.dynamicImportSettled()
    expect(loadedModules.has('@sanity-labs/groq-wasm')).toBe(false)
    expect(loadedModules.has('@sanity-labs/groq-wasm/lazy')).toBe(false)
  })

  it('invites through a toast and offers the switch without any configuration', async () => {
    renderTool({})
    expect(screen.getByTestId('classic-vision')).toBeTruthy()
    expect(screen.getByTestId('classic-try-redesign')).toBeTruthy()
    expect(await screen.findByTestId('vision-redesign-accept')).toBeTruthy()
    expect(screen.getByText('vision.redesign.toast.title')).toBeTruthy()
  })

  it('ignores the removed beta.redesign option', async () => {
    // Configs written for v6 may still pass it; it no longer gates or hides anything
    const legacyOptions = {beta: {redesign: {enabled: false}}}
    renderTool(legacyOptions)
    expect(screen.getByTestId('classic-vision')).toBeTruthy()
    expect(await screen.findByTestId('vision-redesign-accept')).toBeTruthy()

    cleanup()
    storePreference('redesign', true)
    renderTool(legacyOptions)
    expect(await screen.findByTestId('vision')).toBeTruthy()
  })

  it('invites through a toast and switches to the redesign when accepted', async () => {
    renderTool({})
    expect(screen.getByTestId('classic-vision')).toBeTruthy()

    const accept = await screen.findByTestId('vision-redesign-accept')
    await act(async () => {
      fireEvent.click(accept)
    })

    await waitFor(() => expect(screen.getByTestId('vision')).toBeTruthy())
    expect(screen.queryByTestId('classic-vision')).toBeNull()
    // The toast animates out, so it leaves the DOM a moment later
    await waitFor(() => expect(screen.queryByText('vision.redesign.toast.title')).toBeNull())
    expect(readPreference('redesign')).toBe(true)
    expect(readPreference('redesignInvitation')).toBe(false)
  })

  it('remembers a dismissed invitation', async () => {
    renderTool({})
    const dismiss = await screen.findByTestId('vision-redesign-dismiss')
    await act(async () => {
      fireEvent.click(dismiss)
    })

    await waitFor(() => expect(screen.queryByText('vision.redesign.toast.title')).toBeNull())
    expect(screen.getByTestId('classic-vision')).toBeTruthy()
    expect(readPreference('redesignInvitation')).toBe(true)

    cleanup()
    renderTool({})
    expect(screen.getByTestId('classic-vision')).toBeTruthy()
    expect(screen.queryByTestId('vision-redesign-accept')).toBeNull()
  })

  it('keeps the redesign one click away in the classic tool after the invitation is dismissed', async () => {
    storePreference('redesignInvitation', true)
    renderTool({})
    expect(screen.queryByTestId('vision-redesign-accept')).toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByTestId('classic-try-redesign'))
    })
    await waitFor(() => expect(screen.getByTestId('vision')).toBeTruthy())
    expect(readPreference('redesign')).toBe(true)
    expect(readPreference('redesignInvitation')).toBe(false)

    // Back in the classic tool, the invitation shows again
    await act(async () => {
      fireEvent.click(screen.getByTestId('vision'))
    })
    expect(await screen.findByTestId('vision-redesign-accept')).toBeTruthy()
    expect(screen.getByTestId('classic-try-redesign')).toBeTruthy()
  })

  it('opens the redesign directly for an opted-in project and can switch back', async () => {
    storePreference('redesign', true)
    renderTool({})
    const visionRedesign = await screen.findByTestId('vision')

    await act(async () => {
      fireEvent.click(visionRedesign)
    })

    await waitFor(() => expect(screen.getByTestId('classic-vision')).toBeTruthy())
    // The invitation shows again so the redesign stays one click away
    expect(await screen.findByTestId('vision-redesign-accept')).toBeTruthy()
  })

  it('reads the opt-in and the dismissal where earlier releases stored them', async () => {
    localStorage.setItem(
      'sanityVision:redesign:switch-project',
      JSON.stringify({optedIn: true, dismissed: true}),
    )
    renderTool({})
    const visionRedesign = await screen.findByTestId('vision')

    await act(async () => {
      fireEvent.click(visionRedesign)
    })
    // Switching back stores the preferences, which take over from the old key
    await waitFor(() => expect(screen.getByTestId('classic-vision')).toBeTruthy())
    expect(readPreference('redesign')).toBe(false)
    expect(await screen.findByTestId('vision-redesign-accept')).toBeTruthy()
  })
})
