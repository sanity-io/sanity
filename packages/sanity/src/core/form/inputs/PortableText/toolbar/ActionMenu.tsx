import React, {memo, useCallback, useMemo} from 'react'
import {PopoverProps} from '@sanity/ui'
import {EllipsisHorizontalIcon} from '@sanity/icons'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {CollapseMenu, CollapseMenuButton} from '../../../../components/collapseMenu'
import {Button} from '../../../../../ui'
import {PTEToolbarAction, PTEToolbarActionGroup} from './types'
import {useActiveActionKeys, useFocusBlock} from './hooks'
import {getActionIcon} from './helpers'
import {ContextMenuButton} from '../../../../../ui/contextMenuButton'

const CollapseMenuMemo = memo(CollapseMenu)

const MENU_POPOVER_PROPS: PopoverProps = {constrainSize: true, portal: true}

interface ActionMenuProps {
  disabled: boolean
  groups: PTEToolbarActionGroup[]
  isFullscreen?: boolean
  collapsed?: boolean
}

export const ActionMenu = memo(function ActionMenu(props: ActionMenuProps) {
  const {disabled: disabledProp, groups, isFullscreen, collapsed} = props
  const focusBlock = useFocusBlock()
  const editor = usePortableTextEditor()

  const isVoidBlock = focusBlock?._type !== editor.schemaTypes.block.name
  const isEmptyTextBlock =
    !isVoidBlock &&
    Array.isArray(focusBlock.children) &&
    focusBlock.children.length === 1 &&
    focusBlock?.children[0].text === ''

  const disabled = disabledProp || isVoidBlock

  const actions: Array<PTEToolbarAction & {firstInGroup?: true}> = useMemo(
    () =>
      groups.reduce<Array<PTEToolbarAction & {firstInGroup?: true}>>((acc, group) => {
        return acc.concat(
          group.actions.map(
            // eslint-disable-next-line max-nested-callbacks
            (action: PTEToolbarAction, actionIndex) => {
              if (actionIndex === 0) return {...action, firstInGroup: true}
              return action
            },
          ),
        )
      }, []),
    [groups],
  )

  const activeKeys = useActiveActionKeys({actions})

  const handleMenuClose = useCallback(() => {
    PortableTextEditor.focus(editor)
  }, [editor])

  const tooltipPlacement = isFullscreen ? 'bottom' : 'top'

  const children = useMemo(
    () =>
      actions.map((action) => {
        const annotationDisabled = action.type === 'annotation' && isEmptyTextBlock
        const active = activeKeys.includes(action.key)
        return (
          <CollapseMenuButton
            data-testid={`action-button-${action.key}`}
            disabled={disabled || annotationDisabled}
            mode="bleed"
            dividerBefore={action.firstInGroup}
            icon={getActionIcon(action, active)}
            key={action.key}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => action.handle(active)}
            selected={active}
            text={action.title || action.key}
            tooltipText={action.title || action.key}
            tooltipProps={{
              disabled: disabled || annotationDisabled,
              placement: tooltipPlacement,
              portal: 'default',
            }}
          />
        )
      }),
    [actions, activeKeys, disabled, isEmptyTextBlock, tooltipPlacement],
  )

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
      disableRestoreFocusOnClose
      gap={1}
      menuButtonProps={menuButtonProps}
      onMenuClose={handleMenuClose}
    >
      {children}
    </CollapseMenuMemo>
  )
})
