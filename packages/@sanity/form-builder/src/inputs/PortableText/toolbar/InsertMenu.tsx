import React, {memo, useMemo} from 'react'
import {CollapseMenu, CollapseMenuButton, CollapseMenuButtonProps} from '@sanity/base/components'
import {AddIcon} from '@sanity/icons'
import {Button, PopoverProps} from '@sanity/ui'
import {BlockItem} from './types'
import {useFeatures, useFocusBlock} from './hooks'

const CollapseMenuMemo = memo(CollapseMenu)

const MENU_POPOVER_PROPS: PopoverProps = {constrainSize: true}

interface InsertMenuProps {
  disabled: boolean
  items: BlockItem[]
  isFullscreen?: boolean
  collapsed?: boolean
}

export const InsertMenu = memo(function InsertMenu(props: InsertMenuProps) {
  const {disabled, items, isFullscreen, collapsed} = props
  const features = useFeatures()
  const focusBlock = useFocusBlock()

  const collapseButtonProps: CollapseMenuButtonProps = useMemo(
    () => ({padding: 2, mode: 'bleed'}),
    []
  )
  const isVoidFocus = focusBlock && focusBlock._type !== features.types.block.name

  const children = useMemo(() => {
    return items.map((item) => {
      const title = item.type.title || item.type.type.name
      const {handle} = item

      return (
        <CollapseMenuButton
          aria-label={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
          buttonProps={collapseButtonProps}
          collapseText={false}
          disabled={disabled || (isVoidFocus && item.inline === true)}
          icon={item.icon}
          key={item.key}
          onClick={handle}
          text={title}
          tooltipProps={{
            disabled,
            placement: isFullscreen ? 'bottom' : 'top',
            portal: 'default',
            text: `Insert ${title}`,
          }}
        />
      )
    })
  }, [items, collapseButtonProps, disabled, isVoidFocus, isFullscreen])

  const menuButton = useMemo(
    () => <Button icon={AddIcon} mode="bleed" padding={2} disabled={disabled} />,
    [disabled]
  )

  return (
    <CollapseMenuMemo
      gap={1}
      menuButton={menuButton}
      menuPopoverProps={MENU_POPOVER_PROPS}
      collapsed={collapsed}
    >
      {children}
    </CollapseMenuMemo>
  )
})
