// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

/* eslint-disable react/no-multi-comp */

import {
  EditorSelection,
  HotkeyOptions,
  PortableTextEditor,
  PortableTextFeature,
  Type,
} from '@sanity/portable-text-editor'
import {get} from 'lodash'
import LinkIcon from 'part:@sanity/base/link-icon'
import FormatBoldIcon from 'part:@sanity/base/format-bold-icon'
import FormatItalicIcon from 'part:@sanity/base/format-italic-icon'
import FormatStrikethroughIcon from 'part:@sanity/base/format-strikethrough-icon'
import FormatUnderlinedIcon from 'part:@sanity/base/format-underlined-icon'
import FormatCodeIcon from 'part:@sanity/base/format-code-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import FormatListBulletedIcon from 'part:@sanity/base/format-list-bulleted-icon'
import FormatListNumberedIcon from 'part:@sanity/base/format-list-numbered-icon'
import BlockObjectIcon from 'part:@sanity/base/block-object-icon'
import InlineObjectIcon from 'part:@sanity/base/inline-object-icon'
import React from 'react'
import CustomIcon from './CustomIcon'
import {BlockItem, BlockStyleItem, PTEToolbarAction, PTEToolbarActionGroup} from './types'

function getFormatIcon(
  type: string,
  schemaIcon?: React.ComponentType | string
): React.ComponentType {
  if (schemaIcon) {
    return schemaIcon as React.ComponentType
  }

  switch (type) {
    case 'strong':
      return FormatBoldIcon
    case 'em':
      return FormatItalicIcon
    case 'underline':
      return FormatUnderlinedIcon
    case 'strike-through':
      return FormatStrikethroughIcon
    case 'code':
      return FormatCodeIcon
    default:
      return SanityLogoIcon
  }
}

function getPTEFormatActions(
  editor: PortableTextEditor,
  disabled: boolean,
  hotkeyOpts: HotkeyOptions
): PTEToolbarAction[] {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  const focusBlock = PortableTextEditor.focusBlock(editor)

  return features.decorators.map((decorator) => {
    const shortCutKey = Object.keys(hotkeyOpts.marks).find(
      (key) => hotkeyOpts.marks[key] === decorator.value
    )

    let hotkeys: string[]
    if (shortCutKey) {
      hotkeys = [shortCutKey]
    }

    return {
      active: PortableTextEditor.isMarkActive(editor, decorator.value),
      disabled: disabled || (focusBlock ? features.types.block.name !== focusBlock._type : false),
      icon: getFormatIcon(decorator.value, decorator.blockEditor && decorator.blockEditor.icon),
      key: decorator.value,
      handle: (): void => PortableTextEditor.toggleMark(editor, decorator.value),
      hotkeys,
      title: decorator.title,
    }
  })
}

function getListIcon(item: PortableTextFeature, active: boolean): React.ComponentType {
  let Icon: React.ComponentType

  const icon = item.blockEditor ? item.blockEditor.icon : null

  if (icon) {
    if (typeof icon === 'string') {
      // eslint-disable-next-line react/display-name
      Icon = (): JSX.Element => <CustomIcon icon={icon} active={!!active} />
    } else if (typeof icon === 'function') {
      Icon = icon
    }
  }

  if (Icon) return Icon

  switch (item.value) {
    case 'number':
      return FormatListNumberedIcon
    case 'bullet':
      return FormatListBulletedIcon
    default:
      return SanityLogoIcon
  }
}

function getPTEListActions(editor: PortableTextEditor, disabled: boolean): PTEToolbarAction[] {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  const focusBlock = PortableTextEditor.focusBlock(editor)

  return features.lists.map((listItem: PortableTextFeature) => {
    const active = PortableTextEditor.hasListStyle(editor, listItem.value)
    return {
      active,
      key: listItem.value,
      disabled: disabled || (focusBlock ? features.types.block.name !== focusBlock._type : false),
      icon: getListIcon(listItem, active),
      handle: (): void => PortableTextEditor.toggleList(editor, listItem.value),
      title: listItem.title,
    }
  })
}

// eslint-disable-next-line complexity
function getAnnotationIcon(item: PortableTextFeature, active: boolean): React.ComponentType {
  let Icon: React.ComponentType

  const icon: React.ComponentType | string | undefined =
    // @todo: Can this be removed?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item as any).icon ||
    get(item, 'blockEditor.icon') ||
    get(item, 'type.icon') ||
    get(item, 'type.to.icon') ||
    get(item, 'type.to[0].icon')

  if (icon) {
    if (typeof icon === 'string') {
      // eslint-disable-next-line react/display-name
      Icon = (): JSX.Element => <CustomIcon icon={icon} active={!!active} />
    } else if (typeof icon === 'function') {
      Icon = icon
    }
  }

  if (Icon) return Icon

  switch (item.value) {
    case 'link':
      return LinkIcon
    default:
      return SanityLogoIcon
  }
}

function getPTEAnnotationActions(
  editor: PortableTextEditor,
  onInsert: (type: Type) => void
): PTEToolbarAction[] {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  const activeAnnotations = PortableTextEditor.activeAnnotations(editor)
  const focusChild = PortableTextEditor.focusChild(editor)
  const hasText = focusChild && focusChild.text

  return features.annotations.map((item) => {
    const active = !!activeAnnotations.find((an) => an._type === item.type.name)

    return {
      active,
      disabled: !hasText || !focusChild || PortableTextEditor.isVoid(editor, focusChild),
      icon: getAnnotationIcon(item, active),
      key: item.value,
      handle: (): void => {
        if (active) {
          PortableTextEditor.removeAnnotation(editor, item.type)
          PortableTextEditor.focus(editor)
        } else {
          onInsert(item.type)
        }
      },
      title: item.title,
    }
  })
}

export function getPTEToolbarActionGroups(
  editor: PortableTextEditor,
  disabled: boolean,
  onInsertAnnotation: (type: Type) => void,
  hotkeyOpts: HotkeyOptions
): PTEToolbarActionGroup[] {
  return [
    {name: 'format', actions: getPTEFormatActions(editor, disabled, hotkeyOpts)},
    {name: 'list', actions: getPTEListActions(editor, disabled)},
    {name: 'annotation', actions: getPTEAnnotationActions(editor, onInsertAnnotation)},
  ]
}

export function getBlockStyleSelectProps(
  editor: PortableTextEditor
): {items: BlockStyleItem[]; value: BlockStyleItem[]} {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  const items = features.styles.map((style: PortableTextFeature) => {
    return {
      active: PortableTextEditor.hasBlockStyle(editor, style.value),
      key: `style-${style.value}`,
      style: style.value,
      styleComponent: style && style.blockEditor && style.blockEditor.render,
      title: style.title,
    }
  })

  let value = items.filter((item) => item.active)

  if (value.length === 0 && items.length > 1) {
    items.push({
      key: 'style-none',
      style: null,
      styleComponent: null,
      title: ' No style',
      active: true,
    })
    value = items.slice(-1)
  }

  return {
    items,
    value,
  }
}

function getInsertMenuIcon(
  type: Type,
  fallbackIcon: () => React.ReactElement
): React.ComponentType {
  const referenceIcon = get(type, 'to[0].icon')

  return type.icon || (type.type && type.type.icon) || referenceIcon || fallbackIcon
}

export function getInsertMenuItems(
  editor: PortableTextEditor,
  disabled: boolean,
  // selection: EditorSelection,
  onInsertBlock: (type: Type) => void,
  onInsertInline: (type: Type) => void
): BlockItem[] {
  const focusBlock = PortableTextEditor.focusBlock(editor)
  const features = PortableTextEditor.getPortableTextFeatures(editor)

  const blockItems = features.types.blockObjects.map(
    (type, index): BlockItem => ({
      disabled,
      handle: () => onInsertBlock(type),
      icon: getInsertMenuIcon(type, BlockObjectIcon),
      inline: false,
      key: `block-${index}`,
      type,
    })
  )

  const inlineItems = features.types.inlineObjects.map(
    (type, index): BlockItem => ({
      disabled: disabled || (focusBlock ? focusBlock._type !== features.types.block.name : true),
      handle: () => onInsertInline(type),
      icon: getInsertMenuIcon(type, InlineObjectIcon),
      inline: true,
      key: `inline-${index}`,
      type,
    })
  )

  // Do not include items that are supposed to be hidden
  const filteredBlockItems = blockItems.concat(inlineItems).filter((item) => !item.type?.hidden)

  return filteredBlockItems
}
