import {BoundaryElementProvider} from '@sanity/ui'

import {useWorkspace} from '../../studio/workspace'
import {ReleasesNav} from './releases/ReleasesNav'
import {VariantsStudioNavbarLayout} from './variants/VariantsStudioNavbarLayout'

/**
 * The global perspective pickers: one variants filter per variant type (when variants are
 * enabled) followed by the releases picker. Renders a fragment, so the parent lays them out.
 *
 * The pickers' menus measure against the page. The chips clip their own hover fill
 * (`overflow: hidden`), and without a boundary element the menus' size middleware measures
 * against the chip's clipping ancestors instead, which sizes them to the 33px chip: they open
 * empty. This covers both the navbar and the mobile nav drawer.
 * @internal
 */
export function GlobalPerspectiveNav(props: {
  /** Stretches each picker to its parent's width, as in the mobile nav drawer. */
  fullWidth?: boolean
}) {
  const {fullWidth} = props
  const {beta} = useWorkspace()

  return (
    <BoundaryElementProvider element={typeof document === 'undefined' ? null : document.body}>
      {Boolean(beta?.variants?.enabled) && <VariantsStudioNavbarLayout fullWidth={fullWidth} />}
      <ReleasesNav fullWidth={fullWidth} showDetailLinks withReleasesToolButton />
    </BoundaryElementProvider>
  )
}
