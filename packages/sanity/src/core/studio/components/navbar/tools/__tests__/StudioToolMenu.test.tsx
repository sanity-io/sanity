import {render, screen} from '@testing-library/react'
import {act, type ReactNode, Suspense} from 'react'
import {
  HasUsedScheduledPublishingPromiseContext,
  ScheduledPublishingEnabledContext,
  ScheduledPublishingModePromiseContext,
} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {type Tool} from '../../../../../config/types'
import {SCHEDULED_PUBLISHING_TOOL_NAME} from '../../../../../scheduledPublishing/constants'
import {type ScheduledPublishingMode} from '../../../../../scheduledPublishing/contexts/types'
import {StudioToolMenu} from '../StudioToolMenu'

// The menus themselves need the router; this covers which tools reach them
vi.mock('../ToolCollapseMenu', () => ({
  ToolCollapseMenu: ({tools}: {tools: Tool[]}) => (
    <span data-testid="tools">{tools.map((tool) => tool.name).join(',')}</span>
  ),
}))
vi.mock('../ToolVerticalMenu', () => ({
  ToolVerticalMenu: ({tools}: {tools: Tool[]}) => (
    <span data-testid="tools">{tools.map((tool) => tool.name).join(',')}</span>
  ),
}))

const tools: Tool[] = [
  {name: 'structure', title: 'Structure', component: () => null},
  {name: 'vision', title: 'Vision', component: () => null},
  {name: SCHEDULED_PUBLISHING_TOOL_NAME, title: 'Schedules', component: () => null},
]

const noop = () => undefined

function Menu({context = 'topbar'}: {context?: 'topbar' | 'sidebar'}) {
  return (
    <StudioToolMenu
      activeToolName="structure"
      closeSidebar={noop}
      context={context}
      isSidebarOpen={false}
      tools={tools}
      renderDefault={() => <span />}
    />
  )
}

/** What the scheduled publishing plugin's studio provider provides */
function Plugin({
  mode,
  hasUsed,
  children,
}: {
  mode: Promise<ScheduledPublishingMode>
  hasUsed: Promise<boolean>
  children: ReactNode
}) {
  return (
    <ScheduledPublishingEnabledContext value>
      <ScheduledPublishingModePromiseContext value={mode}>
        <HasUsedScheduledPublishingPromiseContext value={hasUsed}>
          {children}
        </HasUsedScheduledPublishingPromiseContext>
      </ScheduledPublishingModePromiseContext>
    </ScheduledPublishingEnabledContext>
  )
}

async function mountWithPlugin(mode: Promise<ScheduledPublishingMode>, hasUsed: Promise<boolean>) {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the menu suspends on the promises; React only resumes it inside an awaited act
  await act(async () => {
    render(
      <Suspense fallback={<span data-testid="pending" />}>
        <Plugin mode={mode} hasUsed={hasUsed}>
          <Menu />
        </Plugin>
      </Suspense>,
    )
  })
}

describe('StudioToolMenu', () => {
  it('leaves the Schedules tool out without suspending where the scheduled publishing plugin is not loaded', () => {
    // No Suspense boundary: a suspended render would throw here
    render(<Menu />)

    expect(screen.getByTestId('tools')).toHaveTextContent('structure,vision')
  })

  it('lists the Schedules tool once the plan check has answered and the dataset has scheduled before', async () => {
    await mountWithPlugin(Promise.resolve('default'), Promise.resolve(true))

    expect(screen.getByTestId('tools')).toHaveTextContent(
      `structure,vision,${SCHEDULED_PUBLISHING_TOOL_NAME}`,
    )
  })

  it('lists the Schedules tool in upsell mode too', async () => {
    await mountWithPlugin(Promise.resolve('upsell'), Promise.resolve(true))

    expect(screen.getByTestId('tools')).toHaveTextContent(
      `structure,vision,${SCHEDULED_PUBLISHING_TOOL_NAME}`,
    )
  })

  it('leaves the Schedules tool out when the dataset has never scheduled anything', async () => {
    await mountWithPlugin(Promise.resolve('default'), Promise.resolve(false))

    expect(screen.getByTestId('tools')).toHaveTextContent('structure,vision')
  })

  it('leaves the Schedules tool out when the feature check failed, without waiting for the usage probe', async () => {
    // A failed check is a complete answer; a slow probe must not hold the tool list
    await mountWithPlugin(Promise.resolve(null), new Promise<boolean>(() => undefined))

    expect(screen.queryByTestId('pending')).not.toBeInTheDocument()
    expect(screen.getByTestId('tools')).toHaveTextContent('structure,vision')
  })

  it('suspends until both answers are in, so the tool list is painted once', async () => {
    let settleHasUsed!: (hasUsed: boolean) => void
    const hasUsed = new Promise<boolean>((resolve) => {
      settleHasUsed = resolve
    })
    await mountWithPlugin(Promise.resolve('default'), hasUsed)

    expect(screen.getByTestId('pending')).toBeInTheDocument()
    expect(screen.queryByTestId('tools')).not.toBeInTheDocument()

    await act(async () => {
      settleHasUsed(true)
    })

    expect(screen.getByTestId('tools')).toHaveTextContent(
      `structure,vision,${SCHEDULED_PUBLISHING_TOOL_NAME}`,
    )
  })

  it('renders the sidebar menu from the same list', async () => {
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the menu suspends on the promises; React only resumes it inside an awaited act
    await act(async () => {
      render(
        <Suspense fallback={<span data-testid="pending" />}>
          <Plugin mode={Promise.resolve('default')} hasUsed={Promise.resolve(true)}>
            <Menu context="sidebar" />
          </Plugin>
        </Suspense>,
      )
    })

    expect(screen.getByTestId('tools')).toHaveTextContent(
      `structure,vision,${SCHEDULED_PUBLISHING_TOOL_NAME}`,
    )
  })
})
