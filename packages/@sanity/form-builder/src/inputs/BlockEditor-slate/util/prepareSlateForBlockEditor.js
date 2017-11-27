import {getSpanType} from './spanHelpers'

export default function prepareSlateForBlockEditor(type) {

  const blockType = type.of.find(ofType => ofType.name === 'block')
  if (!blockType) {
    throw new Error("'block' type is not defined in the schema (required).")
  }

  const styleField = blockType.fields.find(btField => btField.name === 'style')
  if (!styleField) {
    throw new Error("A field with name 'style' is not defined in the block type (required).")
  }

  const textStyles = styleField.type.options.list
    && styleField.type.options.list.filter(style => style.value)
  if (!textStyles || textStyles.length === 0) {
    throw new Error('The style fields need at least one style '
      + "defined. I.e: {title: 'Normal', value: 'normal'}.")
  }

  const listField = blockType.fields.find(btField => btField.name === 'list')
  let listItems = []
  if (listField) {
    listItems = listField.type.options.list
      && listField.type.options.list.filter(listStyle => listStyle.value)
  }


  const memberTypesExceptBlock = type.of.filter(ofType => ofType.name !== 'block')
  const spanType = getSpanType(type)

  return {
    listItems: listItems,
    textStyles: textStyles,
    annotationTypes: spanType.annotations,
    decorators: spanType.decorators,
    customBlocks: memberTypesExceptBlock
  }
}
