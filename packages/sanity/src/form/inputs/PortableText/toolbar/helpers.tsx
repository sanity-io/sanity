import {
  BlockElementIcon,
  BoldIcon,
  CodeIcon,
  InlineElementIcon,
  ItalicIcon,
  LinkIcon,
  OlistIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UnknownIcon,
  UlistIcon,
} from '@sanity/icons'
import {
  HotkeyOptions,
  PortableTextEditor,
  PortableTextFeature,
  PortableTextFeatures,
  // Type,
} from '@sanity/portable-text-editor'
import {get} from 'lodash'
import React from 'react'
import {ObjectSchemaType} from '@sanity/types'
import {FIXME} from '../../../types'
import {BlockItem, BlockStyleItem, PTEToolbarAction, PTEToolbarActionGroup} from './types'
import {CustomIcon} from './CustomIcon'

function getPTEFormatActions(
  editor: PortableTextEditor,
  disabled: boolean,
  hotkeyOpts: HotkeyOptions
): PTEToolbarAction[] {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  return features.decorators.map((decorator) => {
    const shortCutKey = Object.keys(hotkeyOpts.marks || {}).find(
      (key) => hotkeyOpts.marks?.[key] === decorator.value
    )

    let hotkeys: string[] = []
    if (shortCutKey) {
      hotkeys = [shortCutKey]
    }

    return {
      type: 'format',
      disabled: disabled,
      icon: decorator.blockEditor?.icon,
      key: decorator.value,
      handle: (): void => {
        PortableTextEditor.toggleMark(editor, decorator.value)
        PortableTextEditor.focus(editor)
      },
      hotkeys,
      title: decorator.title,
    }
  })
}

function getPTEListActions(editor: PortableTextEditor, disabled: boolean): PTEToolbarAction[] {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  return features.lists.map((listItem: PortableTextFeature) => {
    return {
      type: 'listStyle',
      key: listItem.value,
      disabled: disabled,
      icon: listItem.blockEditor?.icon,
      handle: (): void => {
        PortableTextEditor.toggleList(editor, listItem.value)
      },
      title: listItem.title,
    }
  })
}

function getAnnotationIcon(item: PortableTextFeature): React.ComponentType | string | undefined {
  return (
    get(item, 'icon') ||
    get(item, 'blockEditor.icon') ||
    get(item, 'type.icon') ||
    get(item, 'type.to.icon') ||
    get(item, 'type.to[0].icon')
  )
}

function getPTEAnnotationActions(
  editor: PortableTextEditor,
  disabled: boolean,
  onInsert: (type: ObjectSchemaType) => void
): PTEToolbarAction[] {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  const focusChild = PortableTextEditor.focusChild(editor)
  const hasText = focusChild && focusChild.text
  return features.annotations.map((item) => {
    return {
      type: 'annotation',
      disabled: !hasText || disabled,
      icon: getAnnotationIcon(item),
      key: item.value,
      handle: (active?: boolean): void => {
        if (active) {
          PortableTextEditor.removeAnnotation(editor, item.type)
          PortableTextEditor.focus(editor)
        } else {
          onInsert(item.type as FIXME)
        }
      },
      title: item.title,
    }
  })
}

export function getPTEToolbarActionGroups(
  editor: PortableTextEditor,
  disabled: boolean,
  onInsertAnnotation: (type: ObjectSchemaType) => void,
  hotkeyOpts: HotkeyOptions
): PTEToolbarActionGroup[] {
  return [
    {name: 'format', actions: getPTEFormatActions(editor, disabled, hotkeyOpts)},
    {name: 'list', actions: getPTEListActions(editor, disabled)},
    {name: 'annotation', actions: getPTEAnnotationActions(editor, disabled, onInsertAnnotation)},
  ]
}

export function getBlockStyles(features: PortableTextFeatures): BlockStyleItem[] {
  return features.styles.map((style: PortableTextFeature) => {
    return {
      key: `style-${style.value}`,
      style: style.value,
      styleComponent: style && style.blockEditor && style.blockEditor.render,
      title: style.title,
    }
  })
}

function getInsertMenuIcon(
  type: ObjectSchemaType,
  fallbackIcon: React.ComponentType
): React.ComponentType {
  const referenceIcon = get(type, 'to[0].icon')

  return type.icon || (type.type && type.type.icon) || referenceIcon || fallbackIcon
}

export function getInsertMenuItems(
  features: PortableTextFeatures,
  disabled: boolean,
  onInsertBlock: (type: ObjectSchemaType) => void,
  onInsertInline: (type: ObjectSchemaType) => void
): BlockItem[] {
  const blockItems = features.types.blockObjects.map(
    (type, index): BlockItem => ({
      handle: () => onInsertBlock(type as FIXME),
      icon: getInsertMenuIcon(type as FIXME, BlockElementIcon),
      inline: false,
      key: `block-${index}`,
      type: type as FIXME,
    })
  )

  const inlineItems = features.types.inlineObjects.map(
    (type, index): BlockItem => ({
      handle: () => onInsertInline(type as FIXME),
      icon: getInsertMenuIcon(type as FIXME, InlineElementIcon),
      inline: true,
      key: `inline-${index}`,
      type: type as FIXME,
    })
  )

  // Do not include items that are supposed to be hidden
  const filteredBlockItems = blockItems.concat(inlineItems).filter((item) => !item.type?.hidden)

  return filteredBlockItems
}

const annotationIcons: Record<string, React.ComponentType> = {
  link: LinkIcon,
}

const formatIcons: Record<string, React.ComponentType> = {
  strong: BoldIcon,
  em: ItalicIcon,
  'strike-through': StrikethroughIcon,
  underline: UnderlineIcon,
  code: CodeIcon,
}

const listStyleIcons: Record<string, React.ComponentType> = {
  number: OlistIcon,
  bullet: UlistIcon,
}

export function getActionIcon(action: PTEToolbarAction, active: boolean) {
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
