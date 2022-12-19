import {
  ArraySchemaType,
  BlockSchemaType,
  ObjectSchemaType,
  PortableTextBlock,
  SchemaType,
  SpanSchemaType,
} from '@sanity/types'
import {PortableTextMemberSchemaTypes} from '../types/editor'

export function getPortableTextMemberSchemaTypes(
  portableTextType: ArraySchemaType<PortableTextBlock>
): PortableTextMemberSchemaTypes {
  if (!portableTextType) {
    throw new Error("Parameter 'portabletextType' missing (required)")
  }
  const blockType = portableTextType.of?.find(findBlockType) as BlockSchemaType | undefined
  if (!blockType) {
    throw new Error('Block type is not defined in this schema (required)')
  }
  const childrenField = blockType.fields?.find((field) => field.name === 'children') as
    | {type: ArraySchemaType}
    | undefined
  if (!childrenField) {
    throw new Error('Children field for block type found in schema (required)')
  }
  const ofType = childrenField.type.of
  if (!ofType) {
    throw new Error('Valid types for block children not found in schema (required)')
  }
  const spanType = ofType.find((memberType) => memberType.name === 'span') as
    | ObjectSchemaType
    | undefined
  if (!spanType) {
    throw new Error('Span type not found in schema (required)')
  }
  const inlineObjectTypes = (ofType.filter((memberType) => memberType.name !== 'span') ||
    []) as ObjectSchemaType[]
  const blockObjectTypes = (portableTextType.of?.filter((field) => field.name !== blockType.name) ||
    []) as ObjectSchemaType[]
  return {
    styles: resolveEnabledStyles(blockType),
    decorators: resolveEnabledDecorators(spanType),
    lists: resolveEnabledListItems(blockType),
    block: blockType,
    span: spanType,
    portableText: portableTextType,
    inlineObjects: inlineObjectTypes,
    blockObjects: blockObjectTypes,
    annotations: (spanType as SpanSchemaType).annotations,
  }
}

function resolveEnabledStyles(blockType: ObjectSchemaType) {
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

function resolveEnabledDecorators(spanType: ObjectSchemaType) {
  return (spanType as any).decorators
}

function resolveEnabledListItems(blockType: ObjectSchemaType) {
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

function findBlockType(type: SchemaType): BlockSchemaType | null {
  if (type.type) {
    return findBlockType(type.type)
  }

  if (type.name === 'block') {
    return type as BlockSchemaType
  }

  return null
}
