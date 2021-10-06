import React, {memo, useMemo} from 'react'
import {CollapseMenu, CollapseMenuButton, CollapseMenuButtonProps} from '@sanity/base/components'
import {AddIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import {BlockItem} from './types'
import {useFeatures, useFocusBlock} from './hooks'

const CollapseMenuMemo = memo(CollapseMenu)

interface InsertMenuProps {
  disabled: boolean
  items: BlockItem[]
  readOnly: boolean
  isFullscreen?: boolean
}

export const InsertMenu = memo(function InsertMenu(props: InsertMenuProps) {
  const {disabled, items, readOnly, isFullscreen} = props
  const features = useFeatures()
  const focusBlock = useFocusBlock()

  const collapseButtonProps: CollapseMenuButtonProps = useMemo(
    () => ({padding: isFullscreen ? 3 : 2, mode: 'bleed'}),
    [isFullscreen]
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
          tooltipProps={{disabled: disabled, placement: 'top', text: `Insert ${title}`}}
        />
      )
    })
  }, [_disabled, collapseButtonProps, disabled, items, readOnly])

  const menuButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        mode="bleed"
        padding={isFullscreen ? 3 : 2}
        disabled={disabled || readOnly}
      />
    ),
    [disabled, isFullscreen, readOnly]
  )

  return (
    <CollapseMenuMemo gap={1} menuButton={menuButton}>
      {children}
    </CollapseMenuMemo>
  )
})
