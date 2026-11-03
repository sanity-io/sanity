import {type ComponentType} from 'react'

import {useReleasesToolAvailable} from '../../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../../studio/workspace'
import {type ReleasesNavMenuItemPropsGetter} from '../../types'
import {usePerspective} from '../../usePerspective'
import {ReleasesMenu} from './ReleasesMenu'

interface Props {
  /** Stretches the picker to its parent's width. */
  fullWidth?: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  /**
   * Shows a link to each release's page next to it. Only the navbar's global perspective picker
   * does: a picker that chooses a perspective for something else must not navigate away.
   */
  showDetailLinks?: boolean
}

/**
 * @internal
 */
export const ReleasesNav: ComponentType<Props> = ({fullWidth, menuItemProps, showDetailLinks}) => {
  const releasesToolAvailable = useReleasesToolAvailable()
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const {selectedPerspectiveName} = usePerspective()
  return (
    <ReleasesMenu
      fullWidth={fullWidth}
      selectedPerspectiveName={selectedPerspectiveName}
      areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
      menuItemProps={menuItemProps}
      showDetailLinks={showDetailLinks}
    />
  )
}
