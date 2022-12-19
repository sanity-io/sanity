import React, {memo, useCallback, useMemo} from 'react'
import {Button, ButtonProps, PopoverProps} from '@sanity/ui'
import {EllipsisVerticalIcon} from '@sanity/icons'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {CollapseMenu, CollapseMenuButton} from '../../../../components/collapseMenu'
import {PTEToolbarAction, PTEToolbarActionGroup} from './types'
import {useActiveActionKeys, useFocusBlock} from './hooks'
import {getActionIcon} from './helpers'

const CollapseMenuMemo = memo(CollapseMenu)

const MENU_POPOVER_PROPS: PopoverProps = {constrainSize: true, portal: true}
const COLLAPSE_BUTTON_PROPS: ButtonProps = {padding: 2, mode: 'bleed'}

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
            }
          )
        )
      }, []),
    [groups]
  )

  const activeKeys = useActiveActionKeys({actions})

  const handleMenuClose = useCallback(() => {
    PortableTextEditor.focus(editor)
  }, [editor])

  const children = useMemo(
    () =>
      actions.map((action) => {
        const annotationDisabled = action.type === 'annotation' && isEmptyTextBlock
        const active = activeKeys.includes(action.key)
        return (
          <CollapseMenuButton
            disabled={disabled || annotationDisabled}
            {...COLLAPSE_BUTTON_PROPS}
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
              placement: isFullscreen ? 'bottom' : 'top',
              portal: 'default',
            }}
          />
        )
      }),
    [actions, activeKeys, disabled, isEmptyTextBlock, isFullscreen]
  )

  const menuButtonProps = useMemo(
    () => ({
      button: <Button icon={EllipsisVerticalIcon} mode="bleed" padding={2} disabled={disabled} />,
      popover: MENU_POPOVER_PROPS,
    }),

    [disabled]
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
