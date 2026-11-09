import {studioTheme, ThemeProvider} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {StudioLayoutComponent} from '../StudioLayoutComponent'

const TOOL_HEIGHT = 2000
const FRAME_HEIGHT = 400

vi.mock(import('@sanity/telemetry/react'), async (importOriginal) => ({
  ...(await importOriginal()),
  useTelemetry: () => ({log: noop}) as never,
}))

vi.mock(import('../workspace'), () => ({
  useWorkspace: () =>
    ({
      name: 'default',
      title: 'Default',
      tools: [{name: 'structure', title: 'Structure', component: () => null}],
    }) as never,
}))

vi.mock(import('../networkCheck/useNetworkProtocolCheck'), () => ({
  useNetworkProtocolCheck: () => undefined,
}))

vi.mock(import('../unclaimedProject/UnclaimedProjectNudge'), () => ({
  UnclaimedProjectNudge: () => null,
}))

vi.mock(import('../studio-components-hooks/useNavbarComponent'), () => ({
  useNavbarComponent: () => () => <div data-testid="navbar" style={{height: 50}} />,
}))

// A tool that grows with its content and leaves scrolling to the layout, as the structure tool
// does on narrow screens, rendered without any `activeToolLayout` wrapper (the Tasks plugin's
// wrapper is absent when `tasks.enabled` is false)
vi.mock(import('../studio-components-hooks/useActiveToolLayoutComponent'), () => ({
  useActiveToolLayoutComponent: () => () => (
    <div data-testid="tall-tool" style={{height: TOOL_HEIGHT}} />
  ),
}))

const router = route.create('/', [route.create('/:tool')])

describe('StudioLayoutComponent', () => {
  it('scrolls the active tool when it is taller than an embedding frame that hides overflow', async () => {
    await render(
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      <ThemeProvider theme={studioTheme}>
        <div style={{height: FRAME_HEIGHT, overflow: 'hidden'}}>
          <RouterProvider router={router} state={{tool: 'structure'}} onNavigate={noop}>
            <StudioLayoutComponent />
          </RouterProvider>
        </div>
      </ThemeProvider>,
    )

    const tool = page.getByTestId('tall-tool')
    await expect.element(tool).toBeInTheDocument()

    const scrollContainer = tool.element().parentElement!
    expect(scrollContainer.scrollHeight).toBeGreaterThan(scrollContainer.clientHeight)

    scrollContainer.scrollTop = TOOL_HEIGHT
    expect(scrollContainer.scrollTop).toBe(TOOL_HEIGHT - scrollContainer.clientHeight)
    expect(page.getByTestId('navbar').element().getBoundingClientRect().top).toBe(0)
  })
})
