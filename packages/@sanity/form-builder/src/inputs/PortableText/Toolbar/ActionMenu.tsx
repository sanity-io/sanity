import React, {memo, useMemo} from 'react'
import {CollapseMenu, CollapseMenuButton, CollapseMenuButtonProps} from '@sanity/base/components'
import {Button} from '@sanity/ui'
import {EllipsisVerticalIcon} from '@sanity/icons'
import {PTEToolbarAction, PTEToolbarActionGroup} from './types'
import {useActiveActionKeys, useFeatures, useFocusBlock, useFocusChild} from './hooks'
import {getActionIcon} from './helpers'

const CollapseMenuMemo = memo(CollapseMenu)

interface ActionMenuProps {
  disabled: boolean
  groups: PTEToolbarActionGroup[]
  readOnly: boolean
  isFullscreen?: boolean
}

export const ActionMenu = memo(function ActionMenu(props: ActionMenuProps) {
  const {disabled, groups, readOnly, isFullscreen} = props
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
      groups.reduce((acc, group) => {
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
    () => ({padding: isFullscreen ? 3 : 2, mode: 'bleed'}),
    [isFullscreen]
  )

  const menuButtonPadding = useMemo(() => (isFullscreen ? 3 : 2), [isFullscreen])
  const disableMenuButton = useMemo(() => disabled || readOnly, [disabled, readOnly])

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
            // eslint-disable-next-line react/jsx-handler-names
            onClick={action.handle}
            selected={active}
            text={action.title || action.key}
            tooltipProps={{disabled: disabled, placement: 'top'}}
          />
        )
      }),
    [actions, collapsesButtonProps, disabled, isNotText, readOnly, activeKeys]
  )

  const menuButton = useMemo(
    () => (
      <Button
        icon={EllipsisVerticalIcon}
        mode="bleed"
        padding={menuButtonPadding}
        disabled={disableMenuButton}
      />
    ),
    [disableMenuButton, menuButtonPadding]
  )

  return (
    <CollapseMenuMemo gap={1} menuButton={menuButton}>
      {children}
    </CollapseMenuMemo>
  )
})
