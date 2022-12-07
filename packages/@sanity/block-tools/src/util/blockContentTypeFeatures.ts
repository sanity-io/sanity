import {
  ArraySchemaType,
  BlockSchemaType,
  EnumListProps,
  isBlockChildrenObjectField,
  isBlockListObjectField,
  isBlockSchemaType,
  isBlockStyleObjectField,
  isObjectSchemaType,
  isTitledListValue,
  ObjectSchemaType,
  SpanSchemaType,
  TitledListValue,
} from '@sanity/types'
import {BlockContentFeatures, ResolvedAnnotationType} from '../types'
import {findBlockType} from './findBlockType'

// Helper method for describing a blockContentType's feature set
export default function blockContentFeatures(
  blockContentType: ArraySchemaType
): BlockContentFeatures {
  if (!blockContentType) {
    throw new Error("Parameter 'blockContentType' required")
  }

  const blockType = blockContentType.of.find(findBlockType)
  if (!isBlockSchemaType(blockType)) {
    throw new Error("'block' type is not defined in this schema (required).")
  }

  const ofType = blockType.fields.find(isBlockChildrenObjectField)?.type?.of
  if (!ofType) {
    throw new Error('No `of` declaration found for blocks `children` field')
  }

  const spanType = ofType.find((member): member is SpanSchemaType => member.name === 'span')
  if (!spanType) {
    throw new Error('No `span` type found in `block` schema type `children` definition')
  }

  const inlineObjectTypes = ofType.filter(
    (inlineType): inlineType is ObjectSchemaType =>
      inlineType.name !== 'span' && isObjectSchemaType(inlineType)
  )

  const blockObjectTypes = blockContentType.of.filter(
    (memberType): memberType is ObjectSchemaType =>
      memberType.name !== blockType.name && isObjectSchemaType(memberType)
  )

  return {
    styles: resolveEnabledStyles(blockType),
    decorators: resolveEnabledDecorators(spanType),
    annotations: resolveEnabledAnnotationTypes(spanType),
    lists: resolveEnabledListItems(blockType),
    types: {
      block: blockContentType,
      span: spanType,
      inlineObjects: inlineObjectTypes,
      blockObjects: blockObjectTypes,
    },
  }
}

function resolveEnabledStyles(blockType: BlockSchemaType): TitledListValue<string>[] {
  const styleField = blockType.fields.find(isBlockStyleObjectField)
  if (!styleField) {
    throw new Error("A field with name 'style' is not defined in the block type (required).")
  }

  const textStyles = getTitledListValuesFromEnumListOptions(styleField.type.options)
  if (textStyles.length === 0) {
    throw new Error(
      'The style fields need at least one style ' +
        "defined. I.e: {title: 'Normal', value: 'normal'}."
    )
  }

  return textStyles
}

function resolveEnabledAnnotationTypes(spanType: SpanSchemaType): ResolvedAnnotationType[] {
  return spanType.annotations.map((annotation) => ({
    title: annotation.title,
    type: annotation,
    value: annotation.name,
    icon: annotation.icon,
  }))
}

function resolveEnabledDecorators(spanType: SpanSchemaType): TitledListValue<string>[] {
  return spanType.decorators
}

function resolveEnabledListItems(blockType: BlockSchemaType): TitledListValue<string>[] {
  const listField = blockType.fields.find(isBlockListObjectField)
  if (!listField) {
    throw new Error("A field with name 'list' is not defined in the block type (required).")
  }

  const listItems = getTitledListValuesFromEnumListOptions(listField.type.options)
  if (!listItems) {
    throw new Error('The list field need at least to be an empty array')
  }

  return listItems
}

function getTitledListValuesFromEnumListOptions(
  options: EnumListProps<string> | undefined
): TitledListValue<string>[] {
  const list = options ? options.list : undefined
  if (!Array.isArray(list)) {
    return []
  }

  return list.map((item) => (isTitledListValue(item) ? item : {title: item, value: item}))
}
