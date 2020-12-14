/* eslint-disable react/no-multi-comp */

import {
  EditorSelection,
  HotkeyOptions,
  PortableTextEditor,
  PortableTextFeature,
  Type,
} from '@sanity/portable-text-editor'

import {
  LinkIcon,
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
  CodeIcon,
  OlistIcon,
  UlistIcon,
  BlockElementIcon,
  InlineElementIcon,
  UnknownIcon,
} from '@sanity/icons'

import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {get} from 'lodash'
import React from 'react'
import {Path} from '@sanity/types'
import CustomIcon from './CustomIcon'
import {BlockItem, BlockStyleItem, PTEToolbarAction, PTEToolbarActionGroup} from './types'

function getFormatIcon(
  type: string,
  schemaIcon?: React.ComponentType | string
): React.ComponentType {
  switch (type) {
    case 'strong':
      return BoldIcon
    case 'em':
      return ItalicIcon
    case 'underline':
      return UnderlineIcon
    case 'strike-through':
      return StrikethroughIcon
    case 'code':
      return CodeIcon
    default:
      return (typeof schemaIcon === 'function' && schemaIcon) || UnknownIcon
  }
}

function getPTEFormatActions(
  editor: PortableTextEditor,
  selection: EditorSelection,
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
      disabled: !selection || (focusBlock ? features.types.block.name !== focusBlock._type : false),
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
      return OlistIcon
    case 'bullet':
      return UlistIcon
    default:
      return UnknownIcon
  }
}

function getPTEListActions(
  editor: PortableTextEditor,
  selection: EditorSelection
): PTEToolbarAction[] {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  const focusBlock = PortableTextEditor.focusBlock(editor)

  return features.lists.map((listItem: PortableTextFeature) => {
    const active = PortableTextEditor.hasListStyle(editor, listItem.value)
    return {
      active,
      key: listItem.value,
      disabled: !selection || (focusBlock ? features.types.block.name !== focusBlock._type : false),
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
      return UnknownIcon
  }
}

function getPTEAnnotationActions(
  editor: PortableTextEditor,
  onFocus: (path: Path) => void
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
          return
        }
        const paths = PortableTextEditor.addAnnotation(editor, item.type)
        if (paths && paths.markDefPath) {
          onFocus(paths.markDefPath.concat(FOCUS_TERMINATOR))
        }
      },
      title: item.title,
    }
  })
}

export function getPTEToolbarActionGroups(
  editor: PortableTextEditor,
  selection: EditorSelection,
  onFocus: (path: Path) => void,
  hotkeyOpts: HotkeyOptions
): PTEToolbarActionGroup[] {
  return [
    {name: 'format', actions: getPTEFormatActions(editor, selection, hotkeyOpts)},
    {name: 'list', actions: getPTEListActions(editor, selection)},
    {name: 'annotation', actions: getPTEAnnotationActions(editor, onFocus)},
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

function getInsertMenuIcon(type: Type): React.ComponentType | null {
  const referenceIcon = get(type, 'to[0].icon')

  return type.icon || (type.type && type.type.icon) || referenceIcon
}

export function getInsertMenuItems(
  editor: PortableTextEditor,
  selection: EditorSelection,
  onFocus: (path: Path) => void
): BlockItem[] {
  const focusBlock = PortableTextEditor.focusBlock(editor)
  const features = PortableTextEditor.getPortableTextFeatures(editor)

  const blockItems = features.types.blockObjects.map(
    (type, index): BlockItem => ({
      disabled: !selection,
      handle(): void {
        const path = PortableTextEditor.insertBlock(editor, type)
        onFocus(path.concat(FOCUS_TERMINATOR))
      },
      icon: getInsertMenuIcon(type) || BlockElementIcon,
      inline: false,
      key: `block-${index}`,
      type,
    })
  )

  const inlineItems = features.types.inlineObjects.map(
    (type, index): BlockItem => ({
      disabled: !selection || (focusBlock ? focusBlock._type !== features.types.block.name : true),
      handle(): void {
        const path = PortableTextEditor.insertChild(editor, type)
        onFocus(path.concat(FOCUS_TERMINATOR))
      },
      icon: getInsertMenuIcon(type) || InlineElementIcon,
      inline: true,
      key: `inline-${index}`,
      type,
    })
  )

  // Do not include items that are supposed to be hidden
  const filteredBlockItems = blockItems.concat(inlineItems).filter((item) => !item.type?.hidden)

  return filteredBlockItems
}
