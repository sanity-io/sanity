import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {route, RouterProvider, useRouter, useRouterState} from 'sanity/router'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type Tool} from '../../config/types'
import {StudioToolMountTimeMeasured} from '../__telemetry__/tools.telemetry'
import {ToolLink} from '../components/navbar/tools/ToolLink'
import {createRouter} from '../router/router'
import {StudioLayoutComponent} from '../StudioLayoutComponent'

const workspace = vi.hoisted(() => ({
  tools: [] as Tool[],
  reactActivityMode: false,
}))

const telemetryLog = vi.hoisted(() => vi.fn())

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: telemetryLog}),
}))

vi.mock('../workspace', () => ({
  useWorkspace: () => ({
    name: 'test-workspace',
    title: 'Test Workspace',
    tools: workspace.tools,
    beta: {reactActivityMode: {enabled: workspace.reactActivityMode}},
  }),
}))

vi.mock('../networkCheck/useNetworkProtocolCheck', () => ({
  useNetworkProtocolCheck: vi.fn(),
}))

// A navbar made of real `ToolLink`s, so the restored-URL behaviour is exercised end to end. The
// real hooks return a memoized component; these mocks hoist theirs so the tools are not remounted
// by a changing component identity on every layout render.
vi.mock('../studio-components-hooks/useNavbarComponent', () => {
  function Navbar() {
    return (
      <nav>
        {workspace.tools.map((tool) => (
          <ToolLink key={tool.name} name={tool.name} data-testid={`tool-link-${tool.name}`}>
            {tool.name}
          </ToolLink>
        ))}
      </nav>
    )
  }
  return {useNavbarComponent: () => Navbar}
})

vi.mock('../studio-components-hooks/useActiveToolLayoutComponent', () => {
  function ActiveToolLayout({activeTool}: {activeTool: Tool}) {
    const Component = activeTool.component
    return <Component tool={activeTool} />
  }
  return {useActiveToolLayoutComponent: () => ActiveToolLayout}
})

vi.mock('../StudioErrorBoundary', () => ({
  StudioErrorBoundary: ({children}: {children: ReactNode}) => <>{children}</>,
}))

vi.mock('../unclaimedProject/UnclaimedProjectNudge', () => ({
  UnclaimedProjectNudge: () => null,
}))

vi.mock('../screens/NoToolsScreen', () => ({
  NoToolsScreen: () => <div data-testid="no-tools" />,
}))

vi.mock('../screens/RedirectingScreen', () => ({
  RedirectingScreen: () => <div data-testid="redirecting" />,
}))

vi.mock('../screens/ToolNotFoundScreen', () => ({
  ToolNotFoundScreen: () => <div data-testid="tool-not-found" />,
}))

vi.mock('../../components/loadingBlock/LoadingBlock', () => ({
  LoadingBlock: () => <div data-testid="loading-block" />,
}))

vi.mock('../../limits/context/documents/DocumentLimitsUpsellPanel', () => ({
  DocumentLimitsUpsellPanel: () => null,
}))

vi.mock('../../limits/context/documents/isDocumentLimitError', () => ({
  isDocumentLimitError: () => false,
}))

vi.mock('../../config/isDefaultRouteTool', () => ({
  isDefaultRouteTool: () => true,
}))

/**
 * A tool whose component shows the `id` from its scoped router state and can navigate to one,
 * standing in for a document opened inside the tool.
 */
function makeTool(name: string): Tool {
  return {
    name,
    title: name,
    router: route.create('/', [route.create('/:id')]),
    component: function ToolComponent() {
      const state = useRouterState()
      const router = useRouter()
      const open = useCallback(() => router.navigate({id: 'doc1'}), [router])
      return (
        <div data-testid={`tool-${name}`}>
          <span data-testid={`tool-${name}-id`}>
            {typeof state.id === 'string' ? state.id : ''}
          </span>
          <button type="button" data-testid={`tool-${name}-open`} onClick={open}>
            open
          </button>
        </div>
      )
    },
  }
}

/** A minimal in-memory workspace router: the URL is React state, decoded through the real router. */
function TestRouter({
  tools,
  initialPath,
  children,
}: {
  tools: Tool[]
  initialPath: string
  children: ReactNode
}) {
  const router = useMemo(() => createRouter({basePath: '/', tools}), [tools])
  const [path, setPath] = useState(initialPath)
  const state = useMemo(() => router.decode(path) ?? {}, [router, path])
  const handleNavigate = useCallback((opts: {path: string}) => setPath(opts.path), [])

  return (
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    <ThemeProvider theme={studioTheme}>
      <RouterProvider router={router} state={state} onNavigate={handleNavigate}>
        <span data-testid="location">{path}</span>
        {children}
      </RouterProvider>
    </ThemeProvider>
  )
}

function renderStudio(options: {enabled: boolean}) {
  workspace.reactActivityMode = options.enabled

  return render(
    <TestRouter tools={workspace.tools} initialPath="/structure">
      <StudioLayoutComponent />
    </TestRouter>,
  )
}

function currentPath() {
  return screen.getByTestId('location').textContent
}

function openDocument(toolName: string) {
  return userEvent.click(screen.getByTestId(`tool-${toolName}-open`))
}

function switchTo(toolName: string) {
  return userEvent.click(screen.getByTestId(`tool-link-${toolName}`))
}

describe('StudioLayoutComponent with beta.reactActivityMode', () => {
  beforeEach(() => {
    workspace.tools = ['structure', 'presentation', 'vision', 'media'].map(makeTool)
  })

  afterEach(() => {
    vi.clearAllMocks()
    // Restores the `performance.now` spy even when the test that created it fails midway
    vi.restoreAllMocks()
  })

  describe('when enabled', () => {
    it('keeps the previous tool mounted but hidden when switching tools', async () => {
      renderStudio({enabled: true})
      await openDocument('structure')
      expect(currentPath()).toBe('/structure/doc1')

      await switchTo('presentation')

      expect(currentPath()).toBe('/presentation')
      expect(screen.getByTestId('tool-presentation')).toBeVisible()
      expect(screen.getByTestId('tool-structure')).toBeInTheDocument()
      expect(screen.getByTestId('tool-structure')).not.toBeVisible()
    })

    it('freezes the router state of a hidden tool instead of resetting it', async () => {
      renderStudio({enabled: true})
      await openDocument('structure')
      await switchTo('presentation')

      // The URL no longer carries structure state, but the hidden tool still sees what it had.
      expect(screen.getByTestId('tool-structure-id')).toHaveTextContent('doc1')
      expect(screen.getByTestId('tool-presentation-id')).toHaveTextContent('')
    })

    it('links a hidden tool to the URL it was last at, and restores it on click', async () => {
      renderStudio({enabled: true})
      await openDocument('structure')
      await switchTo('presentation')
      await openDocument('presentation')
      expect(currentPath()).toBe('/presentation/doc1')

      expect(screen.getByTestId('tool-link-structure')).toHaveAttribute('href', '/structure/doc1')

      await switchTo('structure')

      expect(currentPath()).toBe('/structure/doc1')
      expect(screen.getByTestId('tool-structure')).toBeVisible()
      expect(screen.getByTestId('tool-structure-id')).toHaveTextContent('doc1')
      expect(screen.getByTestId('tool-presentation')).not.toBeVisible()
      expect(screen.getByTestId('tool-link-presentation')).toHaveAttribute(
        'href',
        '/presentation/doc1',
      )
    })

    it('does not remount a tool when returning to it', async () => {
      renderStudio({enabled: true})
      const structureBefore = screen.getByTestId('tool-structure')

      await switchTo('presentation')
      await switchTo('structure')

      expect(screen.getByTestId('tool-structure')).toBe(structureBefore)
    })

    it('renders mounted tools in workspace order, not in order of use, so their DOM is never moved', async () => {
      renderStudio({enabled: true})
      await switchTo('vision')
      await switchTo('presentation')
      await switchTo('structure')
      await switchTo('vision')

      const toolScreen = screen.getByTestId('studio-layout')
      const order = Array.from(toolScreen.querySelectorAll('[data-testid^="tool-"]'))
        .map((el) => el.getAttribute('data-testid'))
        .filter((id) => /^tool-(structure|presentation|vision|media)$/.test(id ?? ''))
      expect(order).toEqual(['tool-structure', 'tool-presentation', 'tool-vision'])
    })

    it('measures a revealed tool from the switch, not from the previous activation', async () => {
      const now = vi.spyOn(performance, 'now').mockReturnValue(1_000)
      renderStudio({enabled: true})

      now.mockReturnValue(2_000)
      await switchTo('presentation')

      // Time passes while presentation is active
      now.mockReturnValue(9_000)
      telemetryLog.mockClear()
      await switchTo('structure')

      const revealed = telemetryLog.mock.calls.find(
        ([event, data]) =>
          event === StudioToolMountTimeMeasured &&
          (data as {toolName: string}).toolName === 'structure',
      )
      expect(revealed?.[1]).toMatchObject({toolName: 'structure', isFirstMount: false})
      // T0 is captured in a layout effect when the tool switch commits, so a hidden tool that is
      // shown again is measured from that switch (9000) rather than from its earlier activation
      expect((revealed?.[1] as {durationMs: number}).durationMs).toBe(0)
    })

    it('still links the active tool to its start page', async () => {
      renderStudio({enabled: true})
      await openDocument('structure')

      expect(screen.getByTestId('tool-link-structure')).toHaveAttribute('href', '/structure')
      expect(screen.getByTestId('tool-link-presentation')).toHaveAttribute('href', '/presentation')
    })

    it('keeps at most three tools mounted, dropping the least recently used', async () => {
      renderStudio({enabled: true})
      await openDocument('structure')
      await switchTo('presentation')
      await switchTo('vision')
      await switchTo('structure') // used again, so presentation is now the least recently used
      await switchTo('media')

      expect(screen.queryByTestId('tool-presentation')).not.toBeInTheDocument()
      expect(screen.getByTestId('tool-structure')).not.toBeVisible()
      expect(screen.getByTestId('tool-vision')).not.toBeVisible()
      expect(screen.getByTestId('tool-media')).toBeVisible()
      // presentation was unmounted, so its link falls back to the start page again
      expect(screen.getByTestId('tool-link-presentation')).toHaveAttribute('href', '/presentation')
      expect(screen.getByTestId('tool-link-structure')).toHaveAttribute('href', '/structure/doc1')
    })
  })

  describe('when disabled (default)', () => {
    it('unmounts the previous tool when switching tools', async () => {
      renderStudio({enabled: false})
      await openDocument('structure')
      await switchTo('presentation')

      expect(screen.getByTestId('tool-presentation')).toBeVisible()
      expect(screen.queryByTestId('tool-structure')).not.toBeInTheDocument()
    })

    it('links every tool to its start page', async () => {
      renderStudio({enabled: false})
      await openDocument('structure')
      await switchTo('presentation')

      expect(screen.getByTestId('tool-link-structure')).toHaveAttribute('href', '/structure')
      await switchTo('structure')
      expect(currentPath()).toBe('/structure')
      expect(screen.getByTestId('tool-structure-id')).toHaveTextContent('')
    })
  })
})
