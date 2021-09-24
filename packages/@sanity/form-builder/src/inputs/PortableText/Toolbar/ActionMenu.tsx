import React, {useMemo} from 'react'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {CollapseMenu, CollapseMenuButton, CollapseMenuButtonProps} from '@sanity/base/components'
import {Button} from '@sanity/ui'
import {EllipsisVerticalIcon} from '@sanity/icons'
import {PTEToolbarAction, PTEToolbarActionGroup} from './types'

interface Props {
  disabled: boolean
  groups: PTEToolbarActionGroup[]
  readOnly: boolean
  isFullscreen?: boolean
}

export default function ActionMenu(props: Props) {
  const {disabled, groups, readOnly, isFullscreen} = props
  const editor = usePortableTextEditor()
  const focusBlock = useMemo(() => PortableTextEditor.focusBlock(editor), [editor])
  const focusChild = useMemo(() => PortableTextEditor.focusChild(editor), [editor])
  const ptFeatures = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])

  const isNotText = useMemo(
    () =>
      (focusBlock && focusBlock._type !== ptFeatures.types.block.name) ||
      (focusChild && focusChild._type !== ptFeatures.types.span.name),
    [focusBlock, focusChild, ptFeatures.types.block.name, ptFeatures.types.span.name]
  )

  const actions = useMemo(
    () =>
      groups.reduce((acc, group) => {
        return acc.concat(
          group.actions.map((action: PTEToolbarAction, actionIndex) => {
            if (actionIndex === 0) return {...action, firstInGroup: true}
            return action
          })
        )
      }, []),
    [groups]
  )

  const collapsesButtonProps: CollapseMenuButtonProps = useMemo(
    () => ({padding: isFullscreen ? 3 : 2, mode: 'bleed'}),
    [isFullscreen]
  )

  const menuButtonPadding = useMemo(() => (isFullscreen ? 3 : 2), [isFullscreen])
  const disableMenuButton = useMemo(() => disabled || readOnly, [disabled, readOnly])

  const children = useMemo(
    () =>
      actions.map((action) => {
        const {handle} = action

        return (
          <CollapseMenuButton
            disabled={action.disabled || isNotText || readOnly || disabled}
            buttonProps={collapsesButtonProps}
            dividerBefore={action.firstInGroup}
            icon={action.icon}
            key={action.key}
            onClick={handle}
            selected={action.active}
            text={action.title}
            tooltipProps={{disabled: disabled, placement: 'top'}}
          />
        )
      }),
    [actions, collapsesButtonProps, disabled, isNotText, readOnly]
  )

  return (
    <CollapseMenu
      gap={1}
      menuButton={
        <Button
          icon={EllipsisVerticalIcon}
          mode="bleed"
          padding={menuButtonPadding}
          disabled={disableMenuButton}
        />
      }
    >
      {children}
    </CollapseMenu>
  )
}
