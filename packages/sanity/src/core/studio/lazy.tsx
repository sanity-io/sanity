import {Box, Card} from '@sanity/ui'
import {lazy, Suspense, useEffect} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type NavbarProps} from '../config/studio/types'
import {type Config} from '../config/types'
import {useActiveWorkspace} from './activeWorkspaceMatcher/useActiveWorkspace'

// Code-split facades for the studio shell. Nothing renders the layout or the navbar before the
// user is authenticated and the workspace has loaded, yet both are statically reachable from the
// `sanity` entry (they are exported, and `Studio` renders the layout), so every studio downloaded
// them — search, releases menu, presence, user menu, help resources — before the login screen
// could render. With `autoUpdates: true` that graph is fetched through the import map and nothing
// in it is tree-shaken. The exports keep their names and props; the implementations load on
// first render behind a `Suspense` of their own, and `PreloadStudioShell` starts the fetch as
// soon as authentication succeeds so it overlaps with workspace loading.

const LazyStudioLayoutComponent = lazy(() =>
  import('./StudioLayoutComponent').then((module) => ({default: module.StudioLayoutComponent})),
)

/**
 * @internal
 * The default Studio Layout component. Renders the layout once its code has loaded.
 */
export function StudioLayoutComponent(): React.JSX.Element {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <LazyStudioLayoutComponent />
    </Suspense>
  )
}

const LazyStudioNavbar = lazy(() =>
  import('./components/navbar/StudioNavbar').then((module) => ({default: module.StudioNavbar})),
)

// Same outer box as the real navbar (padding 3 around one row of default-size buttons) so the
// tool area does not jump when the navbar mounts.
function NavbarFallback() {
  return (
    <Card borderBottom data-testid="studio-navbar-loading" padding={3} sizing="border">
      <Box style={{height: 33}} />
    </Card>
  )
}

/**
 * The default Studio navbar. Renders the navbar once its code has loaded.
 *
 * @hidden
 * @beta */
export function StudioNavbar(props: Omit<NavbarProps, 'renderDefault'>): React.JSX.Element {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <LazyStudioNavbar {...props} />
    </Suspense>
  )
}

/**
 * Starts fetching the code-split studio shell (default layout and navbar) so that the fetch
 * overlaps with workspace loading instead of adding a round trip once the workspace is ready.
 * The imports resolve to the same chunks the lazy components request, so nothing loads twice.
 */
function preloadStudioShell(parts: {layout: boolean; navbar: boolean}): void {
  const loads: Promise<unknown>[] = []
  if (parts.layout) loads.push(import('./StudioLayoutComponent'))
  if (parts.navbar) loads.push(import('./components/navbar/StudioNavbar'))
  Promise.all(loads).catch(() => {
    // Ignored: rendering the lazy components surfaces load failures through the error boundary.
  })
}

/**
 * Mount inside the authenticated part of the tree; renders nothing.
 *
 * A default that the active workspace replaces at the root of its config
 * (`studio.components.layout` / `studio.components.navbar`) is not preloaded: such a component
 * may never call `renderDefault`, and the chunk would be wasted; if it does, the default loads on
 * its first render like any lazy component. Plugin layers are not consulted, since they wrap
 * the default rather than replace it.
 */
export function PreloadStudioShell(props: {config: Config}): null {
  const {config} = props
  const {activeWorkspace} = useActiveWorkspace()
  const workspaceConfig = (Array.isArray(config) ? config : [config]).find(
    (workspace) => (workspace.name ?? 'default') === activeWorkspace.name,
  )
  const components = workspaceConfig?.studio?.components
  const layout = !components?.layout
  const navbar = !components?.navbar

  useEffect(() => {
    preloadStudioShell({layout, navbar})
  }, [layout, navbar])

  return null
}
