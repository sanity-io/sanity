import {type ComponentType} from 'react'

import {useReleasesToolAvailable} from '../../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../../studio/workspace'
import {type ReleasesNavMenuItemPropsGetter} from '../../types'
import {usePerspective} from '../../usePerspective'
import {ReleasesMenu} from './ReleasesMenu'

interface Props {
  /** Stretches the chip to its parent's width. */
  fullWidth?: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  /**
   * Shows a link to each release's page next to it. Only the navbar's global perspective picker
   * does: a picker that chooses a perspective for something else must not navigate away.
   */
  showDetailLinks?: boolean
}

/**
 * Releases perspective picker: the single chip, in every studio.
 *
 * Studios without variants used to get the classic pill (the releases tool, the current
 * perspective label and a chevron menu). The open beta uses the chip everywhere, so the
 * navbar looks the same with and without variants.
 *
 * @internal
 */
export const ReleasesNav: ComponentType<Props> = ({fullWidth, menuItemProps, showDetailLinks}) => {
  const releasesToolAvailable = useReleasesToolAvailable()
  const {releases} = useWorkspace()
  const isReleasesEnabled = !!releases?.enabled
  const {selectedPerspectiveName} = usePerspective()

  return (
    <ReleasesMenu
      areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
      fullWidth={fullWidth}
      menuItemProps={menuItemProps}
      selectedPerspectiveName={selectedPerspectiveName}
      showDetailLinks={showDetailLinks}
    />
  )
}
