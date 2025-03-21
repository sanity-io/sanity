import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {upperFirst} from 'lodash'
import {memo, useCallback, useMemo} from 'react'

import {type PopoverProps} from '../../../../../ui-components/popover/Popover'
import {CollapseMenu} from '../../../../components/collapseMenu/CollapseMenu'
import {CollapseMenuButton} from '../../../../components/collapseMenu/CollapseMenuButton'
import {ContextMenuButton} from '../../../../components/contextMenuButton/ContextMenuButton'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useFocusBlock} from './hooks'
import {type BlockItem} from './types'

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
      button: (
        <ContextMenuButton
          data-testid="insert-menu-button"
          disabled={disabled}
          tooltipProps={{placement: tooltipPlacement}}
        />
      ),
      popover: MENU_POPOVER_PROPS,
    }),
    [disabled, tooltipPlacement],
  )

  return (
    <CollapseMenuMemo
      data-testid="insert-menu-auto-collapse-menu"
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
