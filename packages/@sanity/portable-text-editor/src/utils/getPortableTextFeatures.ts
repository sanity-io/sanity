import {PortableTextFeatures} from '../types/portableText'
import {PortableTextType, Type} from '../types/schema'

export function getPortableTextFeatures(portabletextType: PortableTextType): PortableTextFeatures {
  if (!portabletextType) {
    throw new Error("Parameter 'portabletextType' missing (required)")
  }
  const blockType: Type | undefined = portabletextType.of?.find(findBlockType)
  if (!blockType) {
    throw new Error('Block type is not defined in this schema (required)')
  }
  const childrenField =
    blockType && blockType.fields && blockType.fields.find((field) => field.name === 'children')
  if (!childrenField) {
    throw new Error('Children field for block type found in schema (required)')
  }
  const ofType = childrenField.type && childrenField.type.of
  if (!ofType) {
    throw new Error('Valid types for block children not found in schema (required)')
  }
  const spanType = ofType.find((memberType: Type) => memberType.name === 'span')
  if (!spanType) {
    throw new Error('Span type not found in schema (required)')
  }
  const inlineObjectTypes: Type[] = ofType.filter((memberType) => memberType.name !== 'span') || []
  const blockObjectTypes: Type[] =
    portabletextType.of?.filter((field) => field.name !== blockType.name) || []
  const annotations = resolveEnabledAnnotationTypes(spanType)
  return {
    styles: resolveEnabledStyles(blockType),
    decorators: resolveEnabledDecorators(spanType),
    lists: resolveEnabledListItems(blockType),
    annotations: annotations,
    types: {
      block: blockType,
      span: spanType,
      portableText: portabletextType,
      inlineObjects: inlineObjectTypes,
      blockObjects: blockObjectTypes,
      annotations: annotations.map((an: Type) => an.type),
    },
  }
}

function resolveEnabledStyles(blockType: Type) {
  const styleField = blockType.fields?.find((btField) => btField.name === 'style')
  if (!styleField) {
    throw new Error("A field with name 'style' is not defined in the block type (required).")
  }
  const textStyles =
    styleField.type.options?.list &&
    styleField.type.options.list?.filter((style: {value: string}) => style.value)
  if (!textStyles || textStyles.length === 0) {
    throw new Error(
      'The style fields need at least one style ' +
        "defined. I.e: {title: 'Normal', value: 'normal'}."
    )
  }
  return textStyles
}

function resolveEnabledAnnotationTypes(spanType: Type) {
  return spanType.annotations.map((annotation: Type) => {
    return {
      blockEditor: annotation.blockEditor,
      portableText: annotation.portableText,
      title: annotation.title,
      type: annotation,
      value: annotation.name,
      icon: annotation.icon,
    }
  })
}

function resolveEnabledDecorators(spanType: Type) {
  return spanType.decorators
}

function resolveEnabledListItems(blockType: Type) {
  const listField = blockType.fields?.find((btField) => btField.name === 'list')
  if (!listField) {
    throw new Error("A field with name 'list' is not defined in the block type (required).")
  }
  const listItems =
    listField.type.options?.list &&
    listField.type.options.list.filter((list: {value: string}) => list.value)
  if (!listItems) {
    throw new Error('The list field need at least to be an empty array')
  }
  return listItems
}

function findBlockType(type: Type): Type | null {
  if (type.type) {
    return findBlockType(type.type)
  }

  if (type.name === 'block') {
    return type
  }
  return null
}
