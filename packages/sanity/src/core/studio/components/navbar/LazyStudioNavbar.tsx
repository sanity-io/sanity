import {MenuIcon} from '@sanity/icons/Menu'
import {Card} from '@sanity/ui'
import {lazy, Suspense} from 'react'
import {Flex} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {type NavbarProps} from '../../../config/studio/types'

// The navbar (search, releases menu, presence, user menu, help resources) is the heaviest part
// of the studio shell, and nothing renders it before the user is authenticated. Exporting this
// wrapper instead of the implementation keeps all of that out of the login screen's import
// graph; `preloadStudioShell` fetches the chunk as soon as authentication succeeds.
const StudioNavbarComponent = lazy(() =>
  import('./StudioNavbar').then((module) => ({default: module.StudioNavbar})),
)

const HIDDEN_STYLE = {visibility: 'hidden'} as const

/**
 * Same outer card as the real navbar, reserving its height with a hidden copy of the button its
 * own rows are built from rather than a pixel value: the row then follows the theme's button
 * size, page zoom and text scaling the same way the navbar does. `visibility: hidden` keeps it
 * out of the tab order and the accessibility tree.
 *
 * @internal
 */
export function NavbarFallback() {
  return (
    <Card borderBottom data-testid="studio-navbar-loading" padding={3} sizing="border">
      <Flex alignItems="center" aria-hidden="true" style={HIDDEN_STYLE}>
        <Button icon={MenuIcon} mode="bleed" tooltipProps={null} />
      </Flex>
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
