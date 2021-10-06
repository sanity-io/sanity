import {BlockElementIcon, InlineElementIcon} from '@sanity/icons'
import {
  HotkeyOptions,
  PortableTextEditor,
  PortableTextFeature,
  PortableTextFeatures,
  Type,
} from '@sanity/portable-text-editor'
import {get} from 'lodash'
import {BlockItem, BlockStyleItem, PTEToolbarAction, PTEToolbarActionGroup} from './types'

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
      type: 'format',
      disabled: disabled || (focusBlock ? features.types.block.name !== focusBlock._type : false),
      icon: decorator.blockEditor?.icon,
      key: decorator.value,
      handle: (): void => PortableTextEditor.toggleMark(editor, decorator.value),
      hotkeys,
      title: decorator.title,
    }
  })
}

function getPTEListActions(editor: PortableTextEditor, disabled: boolean): PTEToolbarAction[] {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  const focusBlock = PortableTextEditor.focusBlock(editor)

  return features.lists.map((listItem: PortableTextFeature) => {
    return {
      type: 'listStyle',
      key: listItem.value,
      disabled: disabled || (focusBlock ? features.types.block.name !== focusBlock._type : false),
      icon: listItem.blockEditor?.icon,
      handle: (): void => PortableTextEditor.toggleList(editor, listItem.value),
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
  onInsert: (type: Type) => void
): PTEToolbarAction[] {
  const features = PortableTextEditor.getPortableTextFeatures(editor)
  const activeAnnotations = PortableTextEditor.activeAnnotations(editor)
  const focusChild = PortableTextEditor.focusChild(editor)
  const hasText = focusChild && focusChild.text

  return features.annotations.map((item) => {
    const active = !!activeAnnotations.find((an) => an._type === item.type.name)

    return {
      type: 'annotation',
      active,
      disabled: !hasText || !focusChild || PortableTextEditor.isVoid(editor, focusChild),
      icon: getAnnotationIcon(item),
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

function getInsertMenuIcon(type: Type, fallbackIcon: React.ComponentType): React.ComponentType {
  const referenceIcon = get(type, 'to[0].icon')

  return type.icon || (type.type && type.type.icon) || referenceIcon || fallbackIcon
}

export function getInsertMenuItems(
  features: PortableTextFeatures,
  disabled: boolean,
  onInsertBlock: (type: Type) => void,
  onInsertInline: (type: Type) => void
): BlockItem[] {
  const blockItems = features.types.blockObjects.map(
    (type, index): BlockItem => ({
      disabled,
      handle: () => onInsertBlock(type),
      icon: getInsertMenuIcon(type, BlockElementIcon),
      inline: false,
      key: `block-${index}`,
      type,
    })
  )

  const inlineItems = features.types.inlineObjects.map(
    (type, index): BlockItem => ({
      disabled,
      handle: () => onInsertInline(type),
      icon: getInsertMenuIcon(type, InlineElementIcon),
      inline: true,
      key: `inline-${index}`,
      type,
    })
  )

  // Do not include items that are supposed to be hidden
  const filteredBlockItems = blockItems.concat(inlineItems).filter((item) => !item.type?.hidden)

  return filteredBlockItems
}
