import React, {memo, useMemo} from 'react'
import {CollapseMenu, CollapseMenuButton, CollapseMenuButtonProps} from '@sanity/base/components'
import {Button, PopoverProps} from '@sanity/ui'
import {EllipsisVerticalIcon} from '@sanity/icons'
import {PTEToolbarAction, PTEToolbarActionGroup} from './types'
import {useActiveActionKeys, useFeatures, useFocusBlock, useFocusChild} from './hooks'
import {getActionIcon} from './helpers'

const CollapseMenuMemo = memo(CollapseMenu)

const MENU_POPOVER_PROPS: PopoverProps = {constrainSize: true}

interface ActionMenuProps {
  disabled: boolean
  groups: PTEToolbarActionGroup[]
  readOnly: boolean
  isFullscreen?: boolean
  collapsed?: boolean
}

export const ActionMenu = memo(function ActionMenu(props: ActionMenuProps) {
  const {disabled, groups, readOnly, isFullscreen, collapsed} = props
  const focusBlock = useFocusBlock()
  const focusChild = useFocusChild()
  const features = useFeatures()

  const isNotText = useMemo(
    () =>
      (focusBlock && focusBlock._type !== features.types.block.name) ||
      (focusChild && focusChild._type !== features.types.span.name),
    [focusBlock, focusChild, features.types.block.name, features.types.span.name]
  )

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

  const disableMenuButton = disabled || readOnly

  const children = useMemo(
    () =>
      actions.map((action) => {
        const active = activeKeys.includes(action.key)

        return (
          <CollapseMenuButton
            disabled={action.disabled || isNotText || readOnly || disabled}
            buttonProps={collapsesButtonProps}
            dividerBefore={action.firstInGroup}
            icon={getActionIcon(action, active)}
            key={action.key}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => action.handle(active)}
            selected={active}
            text={action.title || action.key}
            tooltipProps={{
              disabled: disabled,
              placement: isFullscreen ? 'bottom' : 'top',
              portal: 'default',
            }}
          />
        )
      }),
    [actions, collapsesButtonProps, disabled, isFullscreen, isNotText, readOnly, activeKeys]
  )

  const menuButton = useMemo(
    () => (
      <Button icon={EllipsisVerticalIcon} mode="bleed" padding={2} disabled={disableMenuButton} />
    ),
    [disableMenuButton]
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
