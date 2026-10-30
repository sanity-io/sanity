import {type ComponentType} from 'react'

import {useReleasesToolAvailable} from '../../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../../studio/workspace'
import {type ReleasesNavMenuItemPropsGetter} from '../../types'
import {usePerspective} from '../../usePerspective'
import {ReleasesMenu} from './ReleasesMenu'

interface Props {
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}

/**
 * @internal
 */
export const ReleasesNav: ComponentType<Props> = ({menuItemProps}) => {
  const releasesToolAvailable = useReleasesToolAvailable()
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const {selectedPerspectiveName} = usePerspective()
  return (
    <ReleasesMenu
      selectedPerspectiveName={selectedPerspectiveName}
      areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
      menuItemProps={menuItemProps}
    />
  )
}
