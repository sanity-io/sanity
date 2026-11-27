import {type SanityClient} from '@sanity/client'
import {cleanup, render, screen} from '@testing-library/react'
import {Activity, type ReactNode} from 'react'
import {type Tool} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {VisionOpened} from './__telemetry__/vision.telemetry'
import {DEFAULT_API_VERSION} from './apiVersions'
import {type VisionRedesignProps} from './redesign/components/VisionRedesign'
import SanityVision from './SanityVision'
import {type VisionConfig} from './types'
import {VISION_VERSION} from './version'

const loadedModules = vi.hoisted(() => new Set<string>())
const telemetry = vi.hoisted(() => ({log: vi.fn()}))
const redesignProps = vi.hoisted(() => ({current: null as VisionRedesignProps | null}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => telemetry,
}))

vi.mock('sanity', () => ({
  useClient: () =>
    ({
      config: () => ({projectId: 'vision-project', dataset: 'test'}),
    }) as unknown as SanityClient,
}))

vi.mock('./containers/VisionContainer', () => ({
  VisionContainer: ({children}: {children: (loaded: unknown) => ReactNode}) =>
    children({datasets: ['test'], projectId: 'vision-project', defaultDataset: 'test'}),
}))

vi.mock('./redesign/components/VisionRedesign', () => ({
  VisionRedesign: (props: VisionRedesignProps) => {
    redesignProps.current = props
    return <div data-testid="vision" />
  },
}))

// The factories run only when something imports the package. The tool must not import it.
vi.mock('@sanity-labs/groq-wasm', () => {
  loadedModules.add('@sanity-labs/groq-wasm')
  return {}
})
vi.mock('@sanity-labs/groq-wasm/lazy', () => {
  loadedModules.add('@sanity-labs/groq-wasm/lazy')
  return {}
})

// Untyped options, so a test can pass keys VisionConfig no longer declares
function toolElement(options: object, mode: 'visible' | 'hidden' = 'visible') {
  const tool = {name: 'vision', title: 'Vision', options} as unknown as Tool<VisionConfig>
  // Inside an Activity boundary, as the studio keeps recent tools mounted (`reactActivityMode`)
  return (
    <Activity mode={mode}>
      <SanityVision tool={tool} />
    </Activity>
  )
}

describe('SanityVision', () => {
  beforeEach(() => {
    loadedModules.clear()
    redesignProps.current = null
    localStorage.clear()
  })

  afterEach(async () => {
    cleanup()
    await vi.dynamicImportSettled()
    expect(loadedModules.has('@sanity-labs/groq-wasm')).toBe(false)
    expect(loadedModules.has('@sanity-labs/groq-wasm/lazy')).toBe(false)
  })

  it('opens the redesigned tool without any configuration', () => {
    render(toolElement({}))
    expect(screen.getByTestId('vision')).toBeTruthy()
    expect(redesignProps.current).toEqual({
      config: {defaultApiVersion: DEFAULT_API_VERSION},
      datasets: ['test'],
      projectId: 'vision-project',
      defaultDataset: 'test',
    })
  })

  it('ignores the removed beta.redesign option', () => {
    // Configs written for v6 may still pass it; it no longer gates or hides anything
    render(toolElement({beta: {redesign: {enabled: false}}}))
    expect(screen.getByTestId('vision')).toBeTruthy()
  })

  it('records one Vision Opened event per mount', () => {
    const {rerender} = render(toolElement({}))
    // Leaving the tool and coming back re-runs its effects without remounting it
    rerender(toolElement({}, 'hidden'))
    rerender(toolElement({}, 'visible'))
    expect(telemetry.log).toHaveBeenCalledExactlyOnceWith(VisionOpened, {
      ui: 'redesign',
      visionVersion: VISION_VERSION,
    })
  })
})
