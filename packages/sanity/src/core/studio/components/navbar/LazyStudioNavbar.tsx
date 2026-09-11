import {Box, Card} from '@sanity/ui'
import {lazy, Suspense} from 'react'

import {type NavbarProps} from '../../../config/studio/types'

// The navbar (search, releases menu, presence, user menu, help resources) is the heaviest part
// of the studio shell, and nothing renders it before the user is authenticated. Exporting this
// wrapper instead of the implementation keeps all of that out of the login screen's import
// graph; `preloadStudioShell` fetches the chunk as soon as authentication succeeds.
const StudioNavbarComponent = lazy(() =>
  import('./StudioNavbar').then((module) => ({default: module.StudioNavbar})),
)

// Same outer box as the real navbar (padding 3 around one row of default-size buttons) so the
// tool area does not jump when it mounts.
function NavbarFallback() {
  return (
    <Card borderBottom data-testid="studio-navbar-loading" padding={3} sizing="border">
      <Box style={{height: 33}} />
    </Card>
  )
}

/**
 * The default Studio navbar. Renders the actual navbar once its code has loaded.
 *
 * @hidden
 * @beta */
export function LazyStudioNavbar(props: Omit<NavbarProps, 'renderDefault'>) {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <StudioNavbarComponent {...props} />
    </Suspense>
  )
}
