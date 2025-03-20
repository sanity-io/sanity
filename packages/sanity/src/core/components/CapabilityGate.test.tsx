import {render, screen} from '@testing-library/react'
import {of} from 'rxjs'
import {beforeEach, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {useRenderingContextStore} from '../store/_legacy/datastores'
import {CapabilityGate} from './CapabilityGate'

vi.mock('../store/_legacy/datastores.ts')

beforeEach(() => {
  vi.clearAllMocks()
})

it('renders the child if the capability is not provided by the rendering context', async () => {
  const wrapper = await createTestProvider()

  vi.mocked(useRenderingContextStore).mockReturnValue({
    renderingContext: of({
      name: 'default',
      metadata: {},
    } as const),
    capabilities: of({}),
  })

  render(
    <CapabilityGate capability="globalUserMenu">
      <div data-testid="user-menu">User</div>
    </CapabilityGate>,
    {wrapper},
  )

  expect(screen.getByTestId('user-menu')).toBeTruthy()
})

it('does not render the child if the capability is provided by the rendering context', async () => {
  const wrapper = await createTestProvider()

  vi.mocked(useRenderingContextStore).mockReturnValue({
    renderingContext: of({
      name: 'coreUi',
      metadata: {
        environment: 'production',
      },
    } as const),
    capabilities: of({
      globalUserMenu: true,
    }),
  })

  render(
    <CapabilityGate capability="globalUserMenu">
      <div data-testid="user-menu">User</div>
    </CapabilityGate>,
    {wrapper},
  )

  expect(screen.queryByTestId('user-menu')).toBeFalsy()
})
