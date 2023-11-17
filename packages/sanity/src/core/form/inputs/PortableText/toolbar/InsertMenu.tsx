import React, {memo, useCallback, useMemo} from 'react'
import {AddIcon} from '@sanity/icons'
import {Button, PopoverProps} from '@sanity/ui'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {upperFirst} from 'lodash'
import {useTranslation} from '../../../../i18n'
import {CollapseMenu, CollapseMenuButton} from '../../../../components/collapseMenu'
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
  const {t} = useTranslation()
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
          aria-label={t(
            item.inline
              ? 'inputs.portable-text.action.insert-inline-object-aria-label'
              : 'inputs.portable-text.action.insert-block-aria-label',
            {typeName: title},
          )}
          padding={2}
          mode="bleed"
          disabled={disabled || (isVoidFocus && item.inline === true)}
          icon={item.icon}
          key={item.key}
          // eslint-disable-next-line react/jsx-no-bind, react/jsx-handler-names
          onClick={item.handle}
          text={title}
          tooltipText={t(
            item.inline
              ? 'inputs.portable-text.action.insert-inline-object'
              : 'inputs.portable-text.action.insert-block',
            {typeName: title},
          )}
          tooltipProps={{
            disabled,
            placement: isFullscreen ? 'bottom' : 'top',
            portal: 'default',
          }}
        />
      )
    })
  }, [disabled, isFullscreen, isVoidFocus, items, t])

  const menuButtonProps = useMemo(
    () => ({
      button: <Button icon={AddIcon} mode="bleed" padding={2} disabled={disabled} />,
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
