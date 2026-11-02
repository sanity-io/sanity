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
}

/**
 * @internal
 */
export const ReleasesNav: ComponentType<Props> = ({fullWidth, menuItemProps}) => {
  const releasesToolAvailable = useReleasesToolAvailable()
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const {selectedPerspectiveName} = usePerspective()
  return (
    <ReleasesMenu
      fullWidth={fullWidth}
      selectedPerspectiveName={selectedPerspectiveName}
      areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
      menuItemProps={menuItemProps}
    />
  )
}
