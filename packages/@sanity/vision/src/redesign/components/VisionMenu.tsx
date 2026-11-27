import {
  Menu,
  type MenuButtonProps,
  MenuDivider,
  MenuItem,
  type MenuItemProps,
} from '@sanity/ui/menu'
import {type ComponentProps} from 'react'
import {Box} from 'ui5'

import {cx} from '../util/cx'
import * as styles from './redesign.module.css'
import * as themeStyles from './themeTokens.module.css'

/**
 * The size of an item in Vision's menus. It has the text and the height of the buttons that open
 * them (`fontSize={1}`, `padding={2}`), so no item is ever larger than its trigger, and it is
 * spaced inline like the items of the Options pickers.
 */
const VISION_MENU_ITEM_PROPS = {
  fontSize: 1,
  gap: 2,
  paddingX: 3,
  paddingY: 2,
  radius: 2,
} as const satisfies MenuItemProps

/** The popover of a Vision menu, which opens like the Options pickers' */
export const VISION_MENU_POPOVER = {
  animate: true,
  constrainSize: true,
  portal: true,
  tone: 'default',
} as const satisfies MenuButtonProps['popover']

/** A menu with the padding, spacing and scrolling every Vision menu shares */
export function VisionMenu({className, ...props}: ComponentProps<typeof Menu>) {
  return (
    <Menu
      className={cx(styles.popoverScroll, themeStyles.themeTokens, className)}
      gap={0}
      padding={1}
      {...props}
    />
  )
}

/** An item of a Vision menu, sized like the button that opens the menu */
export function VisionMenuItem(props: ComponentProps<typeof MenuItem>) {
  return <MenuItem {...VISION_MENU_ITEM_PROPS} {...props} />
}

/** A divider between groups of items, spaced like the API version picker's */
export function VisionMenuDivider() {
  return (
    <Box paddingY={1}>
      <MenuDivider />
    </Box>
  )
}
