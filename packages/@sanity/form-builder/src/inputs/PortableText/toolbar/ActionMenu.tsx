import React, {memo, useCallback, useMemo} from 'react'
import {CollapseMenu, CollapseMenuButton, CollapseMenuButtonProps} from '@sanity/base/components'
import {Button, PopoverProps} from '@sanity/ui'
import {EllipsisVerticalIcon} from '@sanity/icons'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {PTEToolbarAction, PTEToolbarActionGroup} from './types'
import {useActiveActionKeys, useFeatures, useFocusBlock} from './hooks'
import {getActionIcon} from './helpers'

const CollapseMenuMemo = memo(CollapseMenu)

const MENU_POPOVER_PROPS: PopoverProps = {constrainSize: true}

interface ActionMenuProps {
  disabled: boolean
  groups: PTEToolbarActionGroup[]
  isFullscreen?: boolean
  collapsed?: boolean
}

export const ActionMenu = memo(function ActionMenu(props: ActionMenuProps) {
  const {disabled: disabledProp, groups, isFullscreen, collapsed} = props
  const focusBlock = useFocusBlock()
  const features = useFeatures()
  const isVoidBlock = focusBlock?._type !== features.types.block.name
  const isEmptyTextBlock =
    !isVoidBlock && focusBlock?.children.length === 1 && focusBlock?.children[0].text === ''

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

  const collapsesButtonProps: CollapseMenuButtonProps = useMemo(
    () => ({padding: 2, mode: 'bleed'}),
    []
  )

  const editor = usePortableTextEditor()

  // The Sanity-UI collapsed menu item will set focus which is not prevented,
  // so re-focus the editor before calling the action
  const handleCollapsedActionClick = useCallback(
    (action, active) => {
      setTimeout(() => {
        PortableTextEditor.focus(editor)
        action.handle(active)
      }, 0)
    },
    [editor]
  )

  const children = useMemo(
    () =>
      actions.map((action) => {
        const annotationDisabled = action.type === 'annotation' && isEmptyTextBlock
        const active = activeKeys.includes(action.key)
        return (
          <CollapseMenuButton
            disabled={disabled || annotationDisabled}
            buttonProps={collapsesButtonProps}
            dividerBefore={action.firstInGroup}
            icon={getActionIcon(action, active)}
            key={action.key}
            onClick={() => handleCollapsedActionClick(action, active)}
            selected={active}
            text={action.title || action.key}
            tooltipProps={{
              disabled: disabled || annotationDisabled,
              placement: isFullscreen ? 'bottom' : 'top',
              portal: 'default',
            }}
          />
        )
      }),
    [
      actions,
      activeKeys,
      collapsesButtonProps,
      disabled,
      handleCollapsedActionClick,
      isEmptyTextBlock,
      isFullscreen,
    ]
  )

  const menuButton = useMemo(
    () => <Button icon={EllipsisVerticalIcon} mode="bleed" padding={2} disabled={disabled} />,
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
