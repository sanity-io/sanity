import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Menu} from '@sanity/ui/menu'
import {type CSSProperties, type ReactElement} from 'react'

import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'

/** A chip that opens a menu of choices (the layer, the variant, the Against address). Its own file so the review surfaces can use it without importing the pane. */
export function Pick(props: {
  text: string
  testId: string
  items: {
    key: string
    text: string
    icon?: ReactElement
    selected: boolean
    onClick: () => void
    disabled?: boolean
  }[]
  icon?: ReactElement
  style?: CSSProperties
}) {
  return (
    <MenuButton
      button={
        <Chip
          data-testid={props.testId}
          icon={props.icon}
          iconRight={ChevronDownIcon}
          mode="ghost"
          style={props.style}
          text={props.text}
        />
      }
      id={props.testId}
      menu={
        <Menu padding={1}>
          {props.items.map((item) => (
            <MenuItem
              icon={item.icon}
              key={item.key}
              onClick={item.onClick}
              pressed={item.selected}
              text={item.text}
            />
          ))}
        </Menu>
      }
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
}
