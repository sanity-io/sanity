import {Menu, MenuDivider} from '@sanity/ui'
import {type ForwardedRef, forwardRef, Fragment} from 'react'

import {MenuButton, type MenuButtonProps} from '../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {type CollapseMenuProps} from './CollapseMenu'

const MENU_BUTTON_POPOVER_PROPS: MenuButtonProps['popover'] = {
  portal: true,
  constrainSize: true,
}

export const CollapseOverflowMenu = forwardRef(function CollapseOverflowMenu(
  props: Pick<
    CollapseMenuProps,
    'disableRestoreFocusOnClose' | 'menuButtonProps' | 'onMenuClose'
  > & {menuOptions: React.JSX.Element[]; menuButton: React.JSX.Element},
  forwardedRef: ForwardedRef<HTMLButtonElement>,
) {
  const {disableRestoreFocusOnClose, menuButton, menuButtonProps, menuOptions, onMenuClose} = props

  return (
    <MenuButton
      __unstable_disableRestoreFocusOnClose={disableRestoreFocusOnClose}
      id="menu-button"
      ref={forwardedRef}
      onClose={onMenuClose}
      popover={MENU_BUTTON_POPOVER_PROPS}
      {...menuButtonProps}
      button={menuButton}
      menu={
        <Menu>
          {menuOptions.map((c, index) => {
            const {
              // oxlint-disable-next-line no-unused-vars
              collapsedProps,
              // oxlint-disable-next-line no-unused-vars
              expandedProps,
              // oxlint-disable-next-line no-unused-vars
              tooltipProps,
              // oxlint-disable-next-line no-unused-vars
              tooltipText,
              dividerBefore,
              // oxlint-disable-next-line no-unused-vars
              fontSize,
              // oxlint-disable-next-line no-unused-vars
              padding,
              text,
              icon,
              selected,
              ...rest
            } = c.props

            return (
              <Fragment key={c.key}>
                {dividerBefore && index !== 0 && <MenuDivider />}
                <MenuItem text={text} icon={icon} pressed={selected} {...rest} />
              </Fragment>
            )
          })}
        </Menu>
      }
    />
  )
})
