import {Menu, MenuDivider} from '@sanity/ui'
import {type ForwardedRef, forwardRef, Fragment, type ReactElement} from 'react'

import {MenuButton, type MenuButtonProps, MenuItem} from '../../../ui-components'
import {type CollapseMenuProps} from './CollapseMenu'

const MENU_BUTTON_POPOVER_PROPS: MenuButtonProps['popover'] = {
  portal: true,
  constrainSize: true,
}

export const CollapseOverflowMenu = forwardRef(function CollapseOverflowMenu(
  props: Pick<
    CollapseMenuProps,
    'disableRestoreFocusOnClose' | 'menuButtonProps' | 'onMenuClose'
  > & {menuOptions: ReactElement[]; menuButton: ReactElement},
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
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              collapsedProps = {},
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              expandedProps = {},
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              tooltipProps = {},
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              tooltipText,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              dividerBefore,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              fontSize,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
