import {type ReactNode, useMemo} from 'react'
import {
  ActiveWorkspaceMatcherContext,
  VisibleWorkspacesContext,
  WorkspacesContext,
} from 'sanity/_singletons'
import {RouterProvider} from 'sanity/router'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type WorkspaceSummary} from '../../../../config/types'
import {LocaleProvider} from '../../../../i18n/components/LocaleProvider'
import {PackageVersionStatusProvider} from '../../../packageVersionStatus/PackageVersionStatusProvider'
import {createRouter} from '../../../router/router'
import {StudioLayoutComponent} from '../../../StudioLayoutComponent'
import {useWorkspace} from '../../../workspace'
import {type VisibleWorkspacesContextValue} from '../../../workspaces/VisibleWorkspacesProvider'
import {NavbarSkeleton} from '../NavbarSkeleton'

const PANE_STYLE = {width: 900, height: 120, position: 'relative', overflow: 'hidden'} as const

function noop() {}

/**
 * What `StudioLayout` and the workspace loaders provide above `StudioLayoutComponent`, on top of
 * the mock studio from `TestWrapper`: the workspace list, the active workspace, a router that
 * knows the workspace's tools, locale and package version info.
 */
function StudioChromeContexts({children}: {children: ReactNode}) {
  const workspace = useWorkspace()
  const summary = useMemo(
    () =>
      ({
        ...workspace,
        type: 'workspace-summary',
        customIcon: false,
        __internal: {sources: []},
      }) as unknown as WorkspaceSummary,
    [workspace],
  )
  const matcher = useMemo(() => ({activeWorkspace: summary, setActiveWorkspace: noop}), [summary])
  const visible = useMemo<VisibleWorkspacesContextValue>(
    () => ({visibleWorkspaces: [summary], workspaceAuthStates: {}}),
    [summary],
  )
  const workspaces = useMemo(() => [summary], [summary])
  const router = useMemo(
    () => createRouter({basePath: '/', tools: workspace.tools}),
    [workspace.tools],
  )
  return (
    <RouterProvider router={router} state={{}} onNavigate={noop}>
      <LocaleProvider>
        <PackageVersionStatusProvider>
          <WorkspacesContext.Provider value={workspaces}>
            <ActiveWorkspaceMatcherContext.Provider value={matcher}>
              <VisibleWorkspacesContext.Provider value={visible}>
                {children}
              </VisibleWorkspacesContext.Provider>
            </ActiveWorkspaceMatcherContext.Provider>
          </WorkspacesContext.Provider>
        </PackageVersionStatusProvider>
      </LocaleProvider>
    </RouterProvider>
  )
}

/** The navbar placeholder above the navbar it stands in for. */
function SkeletonAboveNavbarHarness() {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
      <div data-testid="skeleton-pane" style={PANE_STYLE}>
        <TestWrapper schemaTypes={[]}>
          <NavbarSkeleton />
        </TestWrapper>
      </div>
      <div data-testid="loaded-pane" style={PANE_STYLE}>
        <TestWrapper schemaTypes={[]}>
          <StudioChromeContexts>
            <StudioLayoutComponent />
          </StudioChromeContexts>
        </TestWrapper>
      </div>
    </div>
  )
}

describe('NavbarSkeleton', () => {
  it('is as tall as StudioNavbar', async () => {
    void render(<SkeletonAboveNavbarHarness />)
    await expect.element(page.getByTestId('studio-navbar')).toBeVisible()
    await expect.element(page.getByTestId('studio-navbar-skeleton')).toBeVisible()

    const navbar = page.getByTestId('studio-navbar').element().getBoundingClientRect()
    const skeleton = page.getByTestId('studio-navbar-skeleton').element().getBoundingClientRect()

    expect(Math.abs(skeleton.height - navbar.height)).toBeLessThanOrEqual(1)
  })
})
