import React, {memo, useCallback, useMemo} from 'react'
import {AddIcon} from '@sanity/icons'
import {PopoverProps} from '@sanity/ui'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {upperFirst} from 'lodash'
import {CollapseMenu, CollapseMenuButton} from '../../../../components/collapseMenu'
import {Button} from '../../../../../ui'
import {BlockItem} from './types'
import {useFocusBlock} from './hooks'

const CollapseMenuMemo = memo(CollapseMenu)

const MENU_POPOVER_PROPS: PopoverProps = {constrainSize: true, portal: true}

interface InsertMenuProps {
  disabled: boolean
  items: BlockItem[]
  isFullscreen?: boolean
  collapsed?: boolean
}

export const InsertMenu = memo(function InsertMenu(props: InsertMenuProps) {
  const {disabled, items, isFullscreen, collapsed} = props
  const focusBlock = useFocusBlock()
  const editor = usePortableTextEditor()

  const isVoidFocus = focusBlock && focusBlock._type !== editor.schemaTypes.block.name

  const handleMenuClose = useCallback(() => {
    PortableTextEditor.focus(editor)
  }, [editor])

  const children = useMemo(() => {
    return items.map((item) => {
      const title = item.type.title || upperFirst(item.type.name)

      return (
        <CollapseMenuButton
          aria-label={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
          size="small"
          mode="bleed"
          disabled={disabled || (isVoidFocus && item.inline === true)}
          icon={item.icon}
          key={item.key}
          // eslint-disable-next-line react/jsx-no-bind, react/jsx-handler-names
          onClick={item.handle}
          text={title}
          tooltipText={`Insert ${title}`}
          tooltipProps={{
            disabled,
            placement: isFullscreen ? 'bottom' : 'top',
            portal: 'default',
          }}
        />
      )
    })
  }, [items, disabled, isVoidFocus, isFullscreen])

  const menuButtonProps = useMemo(
    () => ({
      button: <Button icon={AddIcon} mode="bleed" size="small" disabled={disabled} />,
      popover: MENU_POPOVER_PROPS,
    }),

    [disabled],
  )

  return (
    <CollapseMenuMemo
      collapsed={collapsed}
      collapseText={false}
      disableRestoreFocusOnClose
      gap={1}
      menuButtonProps={menuButtonProps}
      onMenuClose={handleMenuClose}
    >
      {children}
    </CollapseMenuMemo>
  )
})
