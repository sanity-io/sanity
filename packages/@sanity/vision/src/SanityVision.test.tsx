import {cleanup, render, screen} from '@testing-library/react'
import {type Tool} from 'sanity'
import {afterEach, describe, expect, it, vi} from 'vitest'

import SanityVision from './SanityVision'
import {type VisionConfig, type VisionProps} from './types'

vi.mock('sanity', () => ({
  useClient: () => ({config: () => ({projectId: 'test-project', dataset: 'test'})}),
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'v2025-08-18'},
}))

vi.mock('./containers/VisionContainer', () => ({
  VisionContainer: ({config}: VisionProps) => (
    <div data-testid="classic-vision" data-default-api-version={config.defaultApiVersion} />
  ),
}))

function renderVision(options: VisionConfig) {
  const tool: Tool<VisionConfig> = {
    name: 'vision',
    title: 'Vision',
    component: SanityVision,
    options,
  }
  render(<SanityVision tool={tool} />)
}

const configWithRedesign = {defaultApiVersion: 'v2025-02-19', beta: {redesign: {enabled: true}}}

describe('SanityVision', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders the classic tool with the configured API version', () => {
    renderVision({defaultApiVersion: 'v2025-02-19'})

    expect(screen.getByTestId('classic-vision').dataset.defaultApiVersion).toBe('v2025-02-19')
  })

  it('renders the classic tool when the config still sets beta.redesign', () => {
    // @ts-expect-error -- `beta.redesign` is typed `never`, but a JavaScript config can still set it
    renderVision(configWithRedesign)

    expect(screen.getByTestId('classic-vision')).toBeTruthy()
  })

  it('renders the classic tool for a project whose users opted into the redesign', () => {
    localStorage.setItem('sanityVision:redesign:test-project', JSON.stringify({optedIn: true}))
    // @ts-expect-error -- `beta.redesign` is typed `never`, but a JavaScript config can still set it
    renderVision(configWithRedesign)

    expect(screen.getByTestId('classic-vision')).toBeTruthy()
  })
})
