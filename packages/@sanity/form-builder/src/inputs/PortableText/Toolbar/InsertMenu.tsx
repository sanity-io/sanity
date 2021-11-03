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
  readOnly: boolean
  isFullscreen?: boolean
  collapsed?: boolean
}

export const InsertMenu = memo(function InsertMenu(props: InsertMenuProps) {
  const {disabled, items, readOnly, isFullscreen, collapsed} = props
  const features = useFeatures()
  const focusBlock = useFocusBlock()

  const collapseButtonProps: CollapseMenuButtonProps = useMemo(
    () => ({padding: 2, mode: 'bleed'}),
    []
  )

  // @todo: explain what this does
  const _disabled = focusBlock ? focusBlock._type !== features.types.block.name : true

  const children = useMemo(() => {
    return items.map((item) => {
      const title = item.type.title || item.type.type.name
      const {handle} = item

      return (
        <CollapseMenuButton
          aria-label={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
          buttonProps={collapseButtonProps}
          collapseText={false}
          disabled={item.disabled || readOnly || _disabled}
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
  }, [_disabled, collapseButtonProps, disabled, isFullscreen, items, readOnly])

  const menuButton = useMemo(
    () => <Button icon={AddIcon} mode="bleed" padding={2} disabled={disabled || readOnly} />,
    [disabled, readOnly]
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
