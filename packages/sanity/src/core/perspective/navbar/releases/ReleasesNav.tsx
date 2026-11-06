import {Card} from '@sanity/ui'
import {type ComponentType} from 'react'
import {styled} from 'styled-components'

import {useReleasesToolAvailable} from '../../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../../studio/workspace'
import {ReleasesToolLink} from '../../ReleasesToolLink'
import {type ReleasesNavMenuItemPropsGetter} from '../../types'
import {usePerspective} from '../../usePerspective'
import {CurrentGlobalPerspectiveLabel} from '../currentGlobalPerspectiveLabel'
import {ReleasesMenu} from './ReleasesMenu'

const ReleasesNavContainer = styled(Card)`
  position: relative;
  display: flex;
  &:not([hidden]) {
    display: flex;
  }
  align-items: center;
  gap: 2px;
  padding: 2px;
  margin: -3px 0;

  /* The children in button is rendered inside a span, we need to absolutely position the dot for the error. */
  span:has(> [data-ui='error-status-icon']) {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 0;
  }

  a:hover,
  button:hover {
    position: relative;
    z-index: 2;
  }
`

interface Props {
  /** Stretches the variants chip to its parent's width. The classic pill keeps its own width. */
  fullWidth?: boolean
  /** Includes the releases-tool control. The navbar passes this; other callers leave it off. */
  withReleasesToolButton?: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  /**
   * Shows a link to each release's page next to it. Only the navbar's global perspective picker
   * does: a picker that chooses a perspective for something else must not navigate away.
   */
  showDetailLinks?: boolean
}

/**
 * Releases perspective picker.
 *
 * Without variants this is the classic pill: the releases tool, the current
 * perspective label, and a chevron menu. With variants it is the single chip.
 *
 * @internal
 */
export const ReleasesNav: ComponentType<Props> = ({
  fullWidth,
  menuItemProps,
  showDetailLinks,
  withReleasesToolButton,
}) => {
  const releasesToolAvailable = useReleasesToolAvailable()
  const {beta, releases} = useWorkspace()
  const variantsEnabled = Boolean(beta?.variants?.enabled)
  const isReleasesEnabled = !!releases?.enabled
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()

  const menu = (
    <ReleasesMenu
      areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
      fullWidth={variantsEnabled ? fullWidth : undefined}
      menuItemProps={menuItemProps}
      selectedPerspectiveName={selectedPerspectiveName}
      showDetailLinks={variantsEnabled && showDetailLinks}
      variantsEnabled={variantsEnabled}
    />
  )

  if (variantsEnabled) return menu

  return (
    <ReleasesNavContainer border data-ui="ReleasesNav" flex="none" radius="full" tone="inherit">
      {withReleasesToolButton && releasesToolAvailable && <ReleasesToolLink />}
      <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
      {menu}
    </ReleasesNavContainer>
  )
}
