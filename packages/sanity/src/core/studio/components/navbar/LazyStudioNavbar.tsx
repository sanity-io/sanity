import {createLazyComponent} from '../../../components/lazy/createLazyComponent'
import {type NavbarProps} from '../../../config/studio/types'

// The navbar (search, releases menu, presence, user menu, help resources) is the heaviest part
// of the studio shell, and nothing renders it before the user is authenticated. Exporting this
// wrapper instead of the implementation keeps all of that out of the login screen's import
// graph; `preloadStudioShell` fetches the chunk as soon as authentication succeeds.
//
// No boundary of its own, so it suspends to the one `StudioLayout` already has around the whole
// layout. A navbar-shaped fallback cannot be made to match: the real navbar's root is a
// `RootCard` whose `tone` follows the selected perspective inside a `RootLayer zOffset={100}`, so
// a studio opened on a release perspective would paint a neutral, unlayered bar and then switch.
// `StudioLayoutComponent` has always said there is deliberately no boundary around the navbar
// because its height depends on what it renders, and that still holds.
/**
 * The default Studio navbar. Renders the actual navbar once its code has loaded.
 *
 * @internal
 */
export const LazyStudioNavbar = createLazyComponent<Omit<NavbarProps, 'renderDefault'>>(
  () => import('./StudioNavbar.lazy'),
)
