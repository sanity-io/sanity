import {
  DEFAULT_SUPPORTED_STYLES,
  DEFAULT_SUPPORTED_DECORATORS,
  DEFAULT_SUPPORTED_ANNOTATIONS
} from '../constants'


function resolveEnabledStyles(blockType) {
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
  return textStyles.map(style => style.value)
}

function resolveEnabledAnnotationTypes(spanType) {
  return spanType.annotations.map(annotation => annotation.name)
}

function resolveEnabledDecorators(spanType) {
  return spanType.decorators.map(decorator => decorator.value)
}

export default function blockContentTypeToOptions(blockContentType) {
  let blockType
  let spanType
  if (blockContentType) {
    blockType = blockContentType.of.find(field => field.name === 'block')
    if (!blockType) {
      throw new Error("'block' type is not defined in this schema (required).")
    }
    spanType = blockType.fields.find(field => field.name === 'spans')
      .type.of.find(ofType => ofType.name === 'span')
  }
  return {
    enabledBlockStyles: blockType ? resolveEnabledStyles(blockType) : DEFAULT_SUPPORTED_STYLES,
    enabledSpanDecorators: spanType ? resolveEnabledDecorators(spanType) : DEFAULT_SUPPORTED_DECORATORS,
    enabledBlockAnnotations: spanType ? resolveEnabledAnnotationTypes(spanType) : DEFAULT_SUPPORTED_ANNOTATIONS
  }
}
