import {type HotkeyOptions, PortableTextEditor} from '@portabletext/editor'
import {type ApplicableSchema} from '@portabletext/editor/selectors'
import {type PortableTextMemberSchemaTypes} from '@portabletext/sanity-bridge'
import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {BoldIcon} from '@sanity/icons/Bold'
import {CodeIcon} from '@sanity/icons/Code'
import {InlineElementIcon} from '@sanity/icons/InlineElement'
import {ItalicIcon} from '@sanity/icons/Italic'
import {LinkIcon} from '@sanity/icons/Link'
import {OlistIcon} from '@sanity/icons/Olist'
import {StrikethroughIcon} from '@sanity/icons/Strikethrough'
import {UlistIcon} from '@sanity/icons/Ulist'
import {UnderlineIcon} from '@sanity/icons/Underline'
import {UnknownIcon} from '@sanity/icons/Unknown'
import {type ObjectSchemaType} from '@sanity/types'
import capitalize from 'lodash-es/capitalize.js'
import get from 'lodash-es/get.js'
import {type ComponentType, isValidElement} from 'react'
import {isValidElementType} from 'react-is'

import {CustomIcon} from './CustomIcon'
import {
  type BlockItem,
  type BlockStyleItem,
  type PTEToolbarAction,
  type PTEToolbarActionGroup,
} from './types'

function getPTEFormatActions(
  editor: PortableTextEditor,
  schemaTypes: PortableTextMemberSchemaTypes,
  disabled: boolean,
  applicable: ApplicableSchema,
  hotkeyOpts: HotkeyOptions,
  t?: (key: string) => string,
): PTEToolbarAction[] {
  return schemaTypes.decorators.map((decorator) => {
    const shortCutKey = Object.keys(hotkeyOpts.marks || {}).find(
      (key) => hotkeyOpts.marks?.[key] === decorator.value,
    )

    let hotkeys: string[] = []
    if (shortCutKey) {
      hotkeys = [shortCutKey]
    }

    return {
      type: 'format',
      disabled: disabled || !applicable.decorators.has(decorator.value),
      icon: decorator?.icon,
      key: decorator.value,
      handle: (): void => {
        PortableTextEditor.toggleMark(editor, decorator.value)
        PortableTextEditor.focus(editor)
      },
      hotkeys,
      title: decorator.i18nTitleKey && t ? t(decorator.i18nTitleKey) : decorator.title,
    }
  })
}

function getPTEListActions(
  editor: PortableTextEditor,
  schemaTypes: PortableTextMemberSchemaTypes,
  disabled: boolean,
  applicable: ApplicableSchema,
  t?: (key: string) => string,
): PTEToolbarAction[] {
  return schemaTypes.lists.map((listItem) => {
    return {
      type: 'listStyle',
      key: listItem.value,
      disabled: disabled || !applicable.lists.has(listItem.value),
      icon: listItem?.icon,
      handle: (): void => {
        PortableTextEditor.toggleList(editor, listItem.value)
      },
      title: listItem.i18nTitleKey && t ? t(listItem.i18nTitleKey) : listItem.title,
    }
  })
}

function getAnnotationIcon(type: ObjectSchemaType): ComponentType | string | undefined {
  return (
    get(type, 'icon') ||
    get(type, 'type.icon') ||
    get(type, 'type.to.icon') ||
    get(type, 'type.to[0].icon')
  )
}

function getPTEAnnotationActions(
  editor: PortableTextEditor,
  schemaTypes: PortableTextMemberSchemaTypes,
  disabled: boolean,
  applicable: ApplicableSchema,
  onInsert: (type: ObjectSchemaType) => void,
  t?: (key: string) => string,
): PTEToolbarAction[] {
  return schemaTypes.annotations.map((aType) => {
    return {
      type: 'annotation',
      // Empty-block and cross-block disabling live at the render site
      // (`ActionMenu`), which re-renders with the focused block; anything
      // read here is frozen until the memoized action groups rebuild.
      disabled: disabled || !applicable.annotations.has(aType.name),
      icon: getAnnotationIcon(aType),
      key: aType.name,
      handle: (active?: boolean): void => {
        if (active) {
          PortableTextEditor.removeAnnotation(editor, aType)
          PortableTextEditor.focus(editor)
        } else {
          onInsert(aType)
        }
      },
      title:
        aType.i18nTitleKey && t ? t(aType.i18nTitleKey) : aType.title || capitalize(aType.name),
    }
  })
}

/**
 * @internal
 */
export function getPTEToolbarActionGroups(
  editor: PortableTextEditor,
  options: {
    schemaTypes: PortableTextMemberSchemaTypes
    disabled: boolean
    applicable: ApplicableSchema
    onInsertAnnotation: (type: ObjectSchemaType) => void
    hotkeyOpts: HotkeyOptions
    t?: (key: string) => string
  },
): PTEToolbarActionGroup[] {
  const {schemaTypes, disabled, applicable, onInsertAnnotation, hotkeyOpts, t} = options
  return [
    {
      name: 'format',
      actions: getPTEFormatActions(editor, schemaTypes, disabled, applicable, hotkeyOpts, t),
    },
    {name: 'list', actions: getPTEListActions(editor, schemaTypes, disabled, applicable, t)},
    {
      name: 'annotation',
      actions: getPTEAnnotationActions(
        editor,
        schemaTypes,
        disabled,
        applicable,
        onInsertAnnotation,
        t,
      ),
    },
  ]
}

export function getBlockStyles(types: PortableTextMemberSchemaTypes): BlockStyleItem[] {
  return types.styles.map((style) => {
    return {
      key: `style-${style.value}`,
      style: style.value,
      styleComponent: style && style.component,
      title: style.title,
      i18nTitleKey: style.i18nTitleKey,
    }
  })
}

function getInsertMenuIcon(type: ObjectSchemaType, fallbackIcon: ComponentType): ComponentType {
  const referenceIcon = get(type, 'to[0].icon')

  return type.icon || (type.type && type.type.icon) || referenceIcon || fallbackIcon
}

export function getInsertMenuItems(
  types: PortableTextMemberSchemaTypes,
  disabled: boolean,
  onInsertBlock: (type: ObjectSchemaType) => void,
  onInsertInline: (type: ObjectSchemaType) => void,
): BlockItem[] {
  const blockItems = types.blockObjects.map(
    (type, index): BlockItem => ({
      handle: () => onInsertBlock(type),
      icon: getInsertMenuIcon(type, BlockElementIcon),
      inline: false,
      key: `block-${index}`,
      type,
    }),
  )

  const inlineItems = types.inlineObjects.map(
    (type, index): BlockItem => ({
      handle: () => onInsertInline(type),
      icon: getInsertMenuIcon(type, InlineElementIcon),
      inline: true,
      key: `inline-${index}`,
      type,
    }),
  )

  // Do not include items that are supposed to be hidden
  const filteredBlockItems = blockItems.concat(inlineItems).filter((item) => !item.type?.hidden)

  return filteredBlockItems
}

const annotationIcons: Record<string, ComponentType> = {
  link: LinkIcon,
}

const formatIcons: Record<string, ComponentType> = {
  'strong': BoldIcon,
  'em': ItalicIcon,
  'strike-through': StrikethroughIcon,
  'underline': UnderlineIcon,
  'code': CodeIcon,
}

const listStyleIcons: Record<string, ComponentType> = {
  number: OlistIcon,
  bullet: UlistIcon,
}

const ActionIcon = ({action}: {action: PTEToolbarAction}) => {
  const Icon = action.icon

  if (isValidElementType(Icon)) return <Icon />
  if (isValidElement(Icon)) return Icon

  // Fallback for any other ReactNode types
  return null
}

export function getActionIcon(action: PTEToolbarAction, active: boolean) {
  if (action.icon) {
    if (typeof action.icon === 'string') {
      return <CustomIcon active={active} icon={action.icon} />
    }

    return (
      <span data-sanity-icon style={{display: 'contents'}}>
        <ActionIcon action={action} />
      </span>
    )
  }

  if (action.type === 'annotation') {
    return annotationIcons[action.key] || UnknownIcon
  }

  if (action.type === 'listStyle') {
    return listStyleIcons[action.key] || UnknownIcon
  }

  return formatIcons[action.key] || UnknownIcon
}
