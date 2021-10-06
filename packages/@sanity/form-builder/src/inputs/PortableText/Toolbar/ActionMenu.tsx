import React, {useMemo} from 'react'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {CollapseMenu, CollapseMenuButton, CollapseMenuButtonProps} from '@sanity/base/components'
import {Button} from '@sanity/ui'
import {
  BoldIcon,
  CodeIcon,
  EllipsisVerticalIcon,
  ItalicIcon,
  LinkIcon,
  OlistIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UnknownIcon,
  UlistIcon,
} from '@sanity/icons'
import {PTEToolbarAction, PTEToolbarActionGroup} from './types'
import {useFeatures, useFocusBlock, useFocusChild, useSelection} from './hooks'
import CustomIcon from './CustomIcon'

interface ActionMenuProps {
  disabled: boolean
  groups: PTEToolbarActionGroup[]
  readOnly: boolean
  isFullscreen?: boolean
}

const annotationIcons = {
  link: LinkIcon,
}

const formatIcons = {
  strong: BoldIcon,
  em: ItalicIcon,
  'strike-through': StrikethroughIcon,
  underline: UnderlineIcon,
  code: CodeIcon,
}

const listStyleIcons = {
  number: OlistIcon,
  bullet: UlistIcon,
}

function getActionIcon(action: PTEToolbarAction, active: boolean) {
  if (action.icon) {
    if (typeof action.icon === 'string') {
      return <CustomIcon active={active} icon={action.icon} />
    }

    return action.icon
  }

  if (action.type === 'annotation') {
    return annotationIcons[action.key] || UnknownIcon
  }

  if (action.type === 'listStyle') {
    return listStyleIcons[action.key] || UnknownIcon
  }

  return formatIcons[action.key] || UnknownIcon
}

export default function ActionMenu(props: ActionMenuProps) {
  const {disabled, groups, readOnly, isFullscreen} = props
  const editor = usePortableTextEditor()
  const selection = useSelection()
  const focusBlock = useFocusBlock()
  const focusChild = useFocusChild()
  const features = useFeatures()

  const isNotText = useMemo(
    () =>
      (focusBlock && focusBlock._type !== features.types.block.name) ||
      (focusChild && focusChild._type !== features.types.span.name),
    [focusBlock, focusChild, features.types.block.name, features.types.span.name]
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
        const selected = PortableTextEditor.isMarkActive(editor, action.key)

        return (
          <CollapseMenuButton
            disabled={action.disabled || isNotText || readOnly || disabled}
            buttonProps={collapsesButtonProps}
            dividerBefore={action.firstInGroup}
            icon={getActionIcon(action, selected)}
            key={action.key}
            // eslint-disable-next-line react/jsx-handler-names
            onClick={action.handle}
            selected={selected}
            text={action.title || action.key}
            tooltipProps={{disabled: disabled, placement: 'top'}}
          />
        )
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      actions,
      collapsesButtonProps,
      disabled,
      editor,
      isNotText,
      readOnly,
      // This is needed so that active actions update as `selection` changes
      selection,
    ]
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

  const collapseMenu = useMemo(
    () => (
      <CollapseMenu gap={1} menuButton={menuButton}>
        {children}
      </CollapseMenu>
    ),
    [children, menuButton]
  )

  return collapseMenu
}
