import {useWorkspace} from '../../studio/workspace'
import {ReleasesNav} from './releases/ReleasesNav'
import {VariantsStudioNavbarLayout} from './variants/VariantsStudioNavbarLayout'

/**
 * The global perspective pickers: one variants filter per variant type (when variants are
 * enabled) followed by the releases picker. Renders a fragment, so the parent lays them out.
 * @internal
 */
export function GlobalPerspectiveNav(props: {
  /** Stretches each picker to its parent's width, as in the mobile nav drawer. */
  fullWidth?: boolean
}) {
  const {fullWidth} = props
  const {beta} = useWorkspace()

  return (
    <>
      {Boolean(beta?.variants?.enabled) && <VariantsStudioNavbarLayout fullWidth={fullWidth} />}
      <ReleasesNav fullWidth={fullWidth} />
    </>
  )
}
