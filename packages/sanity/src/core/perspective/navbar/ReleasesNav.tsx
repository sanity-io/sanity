import {Card} from '@sanity/ui'
import {type ComponentType} from 'react'

import {usePerspective} from '../../perspective/usePerspective'
import {useReleasesToolAvailable} from '../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../studio/workspace'
import {ReleasesToolLink} from '../ReleasesToolLink'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {CurrentGlobalPerspectiveLabel} from './currentGlobalPerspectiveLabel'
import {GlobalPerspectiveMenu} from './GlobalPerspectiveMenu'
import {releasesNavContainer} from './ReleasesNav.css'

interface Props {
  withReleasesToolButton?: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}

/**
 * @internal
 */
export const ReleasesNav: ComponentType<Props> = ({withReleasesToolButton, menuItemProps}) => {
  const releasesToolAvailable = useReleasesToolAvailable()
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  return (
    <Card className={releasesNavContainer} flex="none" tone="inherit" radius="full" data-ui="ReleasesNav" border>
      {withReleasesToolButton && releasesToolAvailable && <ReleasesToolLink />}
      <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
      <GlobalPerspectiveMenu
        selectedPerspectiveName={selectedPerspectiveName}
        areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
        menuItemProps={menuItemProps}
      />
    </Card>
  )
}
