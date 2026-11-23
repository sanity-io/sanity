import {type ComponentType} from 'react'

import {useReleasesEnabled} from '../../../releases/hooks/useReleasesEnabled'
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
  const areReleasesEnabled = useReleasesEnabled()
  const {selectedPerspectiveName} = usePerspective()

  return (
    <ReleasesMenu
      areReleasesEnabled={areReleasesEnabled}
      fullWidth={fullWidth}
      menuItemProps={menuItemProps}
      selectedPerspectiveName={selectedPerspectiveName}
      showDetailLinks={showDetailLinks}
    />
  )
}
