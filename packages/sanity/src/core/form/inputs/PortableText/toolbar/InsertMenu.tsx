import React, {memo, useCallback, useMemo} from 'react'
import {AddIcon} from '@sanity/icons'
import {PopoverProps} from '@sanity/ui'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {upperFirst} from 'lodash'
import {useTranslation} from '../../../../i18n'
import {CollapseMenu, CollapseMenuButton} from '../../../../components/collapseMenu'
import {Button} from '../../../../../ui'
import {BlockItem} from './types'
import {useFocusBlock} from './hooks'
import {ContextMenuButton} from '../../../../../ui/contextMenuButton'

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

  const tooltipPlacement = isFullscreen ? 'bottom' : 'top'

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
            placement: tooltipPlacement,
            portal: 'default',
          }}
        />
      )
    })
  }, [disabled, isVoidFocus, items, t, tooltipPlacement])

  const menuButtonProps = useMemo(
    () => ({
      button: <ContextMenuButton disabled={disabled} tooltipPlacement={tooltipPlacement} />,
      popover: MENU_POPOVER_PROPS,
    }),
    [disabled, tooltipPlacement],
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
