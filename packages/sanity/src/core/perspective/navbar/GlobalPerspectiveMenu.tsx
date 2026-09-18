import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
// oxlint-disable-next-line no-restricted-imports -- Button requires props, only supported by @sanity/ui
import {Button} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {useCallback, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton} from '../../../ui-components/menuButton/MenuButton'
import {oversizedButtonStyle} from '../styles'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {ReleasesList} from './ReleasesList'

const StyledMenu = styled(Menu)`
  /* Fixed, not a min/max range. The width followed the widest row, so it moved between states: a
     narrower panel at two releases than at twenty-five, and a panel that shrank mid-filter as the
     long titles dropped out of the results. 247px is what the design gives both perspective
     popovers (PopoverMenu nodes 6998:20254 and 7737:50936). Long titles already truncate, so
     nothing needs the panel to grow for them. */
  width: 247px;
  /* Remove the default menu gap*/
  > [data-ui='Stack'] {
    gap: 0;
  }
`
const OversizedButton = styled(Button)`
  ${oversizedButtonStyle}
`

export function GlobalPerspectiveMenu({
  areReleasesEnabled = true,
  menuItemProps,
  trigger,
}: {
  areReleasesEnabled: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  /**
   * Overrides the chevron-only trigger. The perspective bar passes a full
   * labelled button so the whole pill is one touch target.
   */
  trigger?: React.ReactElement
}): React.JSX.Element {
  const [filterQuery, setFilterQuery] = useState('')

  // The popover's content is kept mounted while closed (Sanity UI wraps it in
  // React's state-preserving `Activity`), so the query has to be cleared by hand
  // or it reappears on the next open.
  const handleMenuClose = useCallback(() => setFilterQuery(''), [])

  return (
    <MenuButton
      button={
        trigger ?? (
          <OversizedButton
            data-testid="global-perspective-menu-button"
            iconRight={ChevronDownIcon}
            mode="bleed"
            padding={2}
            radius="full"
          />
        )
      }
      id="releases-menu"
      onClose={handleMenuClose}
      menu={
        <StyledMenu data-testid="release-menu" padding={0}>
          <ReleasesList
            areReleasesEnabled={areReleasesEnabled}
            menuItemProps={menuItemProps}
            filterQuery={filterQuery}
            onFilterQueryChange={setFilterQuery}
          />
        </StyledMenu>
      }
      popover={{
        __unstable_margins: [0, 0, 32, 0],
        constrainSize: true,
        // Left-aligned with the trigger: the panel's left edge meets the
        // button's, so the menu items line up under the button's own icon.
        // `bottom-end` stays as the fallback so a panel that would overflow the
        // viewport flips horizontally rather than vertically.
        fallbackPlacements: ['bottom-end'],
        placement: 'bottom-start',
        portal: true,
        // @ts-expect-error PopoverProps doesn't include `style`, but the Popover implementation accepts it via React.HTMLProps<HTMLDivElement>
        style: {overflow: 'hidden'} as React.CSSProperties,
        tone: 'default',
        zOffset: 3000,
      }}
    />
  )
}
