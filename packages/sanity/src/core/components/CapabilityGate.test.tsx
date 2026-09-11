import {render, screen} from '@testing-library/react'
import {of} from 'rxjs'
import {beforeEach, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {useRenderingContextStore} from '../store/datastores'
import {createRenderingContextStore} from '../store/renderingContext/createRenderingContextStore'
import {
  type CapabilityRecord,
  type RenderingContextStore,
  type StudioRenderingContext,
} from '../store/renderingContext/types'
import {CapabilityGate} from './CapabilityGate'

vi.mock('../store/datastores')

const DEFAULT_CONTEXT: StudioRenderingContext = {name: 'default', metadata: {}}
const CORE_UI_CONTEXT: StudioRenderingContext = {
  name: 'coreUi',
  metadata: {environment: 'production'},
}
const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'production'}),
)}`

function mockRenderingContextStore(
  renderingContext: StudioRenderingContext,
  capabilities: CapabilityRecord,
): void {
  vi.mocked(useRenderingContextStore).mockReturnValue({
    renderingContext: of(renderingContext),
    capabilities: of(capabilities),
    getRenderingContext: () => renderingContext,
    getCapabilities: () => capabilities,
  } satisfies RenderingContextStore)
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('does not render a local implementation for even one commit while inside core ui', async () => {
  const wrapper = await createTestProvider()
  // the real store: it resolves the capabilities as it is created
  vi.mocked(useRenderingContextStore).mockReturnValue(createRenderingContextStore(CORE_UI_SEARCH))
  const childRenders: true[] = []
  function LocalUserMenu() {
    childRenders.push(true)
    return <div data-testid="user-menu">User</div>
  }

  render(
    <CapabilityGate capability="globalUserMenu" condition="unavailable">
      <LocalUserMenu />
    </CapabilityGate>,
    {wrapper},
  )

  expect(childRenders).toHaveLength(0)
  expect(screen.queryByTestId('user-menu')).toBeFalsy()
})

it('renders the child if the capability is not provided by the rendering context and the condition is "unavailable"', async () => {
  const wrapper = await createTestProvider()

  mockRenderingContextStore(DEFAULT_CONTEXT, {})

  render(
    <CapabilityGate capability="globalUserMenu" condition="unavailable">
      <div data-testid="user-menu">User</div>
    </CapabilityGate>,
    {wrapper},
  )

  expect(screen.getByTestId('user-menu')).toBeTruthy()
})

it('does not render the child if the capability is provided by the rendering context and the condition is "unavailable"', async () => {
  const wrapper = await createTestProvider()

  mockRenderingContextStore(CORE_UI_CONTEXT, {globalUserMenu: true})

  render(
    <CapabilityGate capability="globalUserMenu" condition="unavailable">
      <div data-testid="user-menu">User</div>
    </CapabilityGate>,
    {wrapper},
  )

  expect(screen.queryByTestId('user-menu')).toBeFalsy()
})

it('renders the child if the capability is provided by the rendering context and the condition is "available"', async () => {
  const wrapper = await createTestProvider()

  mockRenderingContextStore(CORE_UI_CONTEXT, {globalUserMenu: true})

  render(
    <CapabilityGate capability="globalUserMenu" condition="available">
      <div data-testid="user-menu">User</div>
    </CapabilityGate>,
    {wrapper},
  )

  expect(screen.getByTestId('user-menu')).toBeTruthy()
})

it('does not render the child if the capability is not provided by the rendering context and the condition is "available"', async () => {
  const wrapper = await createTestProvider()

  mockRenderingContextStore(DEFAULT_CONTEXT, {})

  render(
    <CapabilityGate capability="globalUserMenu" condition="available">
      <div data-testid="user-menu">User</div>
    </CapabilityGate>,
    {wrapper},
  )

  expect(screen.queryByTestId('user-menu')).toBeFalsy()
})
