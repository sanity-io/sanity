import {type SanityClient} from '@sanity/client'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {type Tool} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import SanityVision from './SanityVision'
import {type VisionConfig} from './types'
import {writeRedesignPreference} from './vista/redesignPreference'

const theme = buildTheme()

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
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'X'},
}))

vi.mock('./containers/VisionContainer', () => ({
  VisionContainer: ({children}: {children: (loaded: unknown) => ReactNode}) =>
    children({datasets: ['test'], projectId: 'switch-project', defaultDataset: 'test'}),
}))

vi.mock('./components/VisionGui', () => ({
  VisionGui: () => <div data-testid="classic-vision" />,
}))

vi.mock('./vista/components/VistaGui', () => ({
  VistaGui: ({onSwitchToClassic}: {onSwitchToClassic: () => void}) => (
    <button data-testid="vista" onClick={onSwitchToClassic} type="button">
      vista
    </button>
  ),
}))

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

describe('SanityVision experience switch', () => {
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
    expect(screen.queryByText('vista.redesign.toast.title')).toBeNull()
  })

  it('renders the classic tool even for a stored opt-in when the beta flag is off', () => {
    writeRedesignPreference('switch-project', {optedIn: true})
    renderTool({beta: {redesign: {enabled: false}}})
    expect(screen.getByTestId('classic-vision')).toBeTruthy()
    expect(screen.queryByTestId('vista')).toBeNull()
  })

  it('invites through a toast and switches to the redesign when accepted', async () => {
    renderTool({beta: {redesign: {enabled: true}}})
    expect(screen.getByTestId('classic-vision')).toBeTruthy()

    const accept = await screen.findByTestId('vision-redesign-accept')
    await act(async () => {
      fireEvent.click(accept)
    })

    await waitFor(() => expect(screen.getByTestId('vista')).toBeTruthy())
    expect(screen.queryByTestId('classic-vision')).toBeNull()
    // The toast animates out, so it leaves the DOM a moment later
    await waitFor(() => expect(screen.queryByText('vista.redesign.toast.title')).toBeNull())
    expect(
      JSON.parse(localStorage.getItem('sanityVision:redesign:switch-project') || '{}'),
    ).toEqual({
      optedIn: true,
      dismissed: false,
    })
  })

  it('remembers a dismissed invitation', async () => {
    renderTool({beta: {redesign: {enabled: true}}})
    const dismiss = await screen.findByTestId('vision-redesign-dismiss')
    await act(async () => {
      fireEvent.click(dismiss)
    })

    await waitFor(() => expect(screen.queryByText('vista.redesign.toast.title')).toBeNull())
    expect(screen.getByTestId('classic-vision')).toBeTruthy()

    cleanup()
    renderTool({beta: {redesign: {enabled: true}}})
    expect(screen.getByTestId('classic-vision')).toBeTruthy()
    expect(screen.queryByTestId('vision-redesign-accept')).toBeNull()
  })

  it('opens the redesign directly for an opted-in project and can switch back', async () => {
    writeRedesignPreference('switch-project', {optedIn: true})
    renderTool({beta: {redesign: {enabled: true}}})
    const vista = await screen.findByTestId('vista')

    await act(async () => {
      fireEvent.click(vista)
    })

    await waitFor(() => expect(screen.getByTestId('classic-vision')).toBeTruthy())
    // The invitation shows again so the redesign stays one click away
    expect(await screen.findByTestId('vision-redesign-accept')).toBeTruthy()
  })
})
