import React, {useMemo} from 'react'
import {CollapseMenu, CollapseMenuButton, CollapseMenuButtonProps} from '@sanity/base/components'
import {AddIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import {BlockItem} from './types'

interface InsertMenuProps {
  disabled: boolean
  items: BlockItem[]
  readOnly: boolean
  isFullscreen?: boolean
}

export default function InsertMenu(props: InsertMenuProps) {
  const {disabled, items, readOnly, isFullscreen} = props

  const collapseButtonProps: CollapseMenuButtonProps = useMemo(
    () => ({padding: isFullscreen ? 3 : 2, mode: 'bleed'}),
    [isFullscreen]
  )

  const menuButtonPadding = useMemo(() => (isFullscreen ? 3 : 2), [isFullscreen])
  const disableMenuButton = useMemo(() => disabled || readOnly, [disabled, readOnly])

  const children = useMemo(() => {
    return items.map((item) => {
      const title = item.type.title || item.type.type.name
      const {handle} = item

      return (
        <CollapseMenuButton
          aria-label={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
          buttonProps={collapseButtonProps}
          collapseText={false}
          disabled={item.disabled || readOnly}
          icon={item?.icon}
          key={item.key}
          onClick={handle}
          text={title}
          tooltipProps={{disabled: disabled, placement: 'top', text: `Insert ${title}`}}
        />
      )
    })
  }, [collapseButtonProps, disabled, items, readOnly])

  const menuButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        mode="bleed"
        padding={menuButtonPadding}
        disabled={disableMenuButton}
      />
    ),
    [disableMenuButton, menuButtonPadding]
  )

  const collapseMenu = useMemo(
    () => (
      <CollapseMenu gap={1} menuButton={menuButton}>
        {children}
      </CollapseMenu>
    ),
    [children, menuButton]
  )

  return collapseMenu
}
