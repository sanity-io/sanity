import HtmlDeserializer from '../conversion/slateHTMLDeserializer'
import {getSpanType} from '../util/spanHelpers'

function onPasteHtml(blockEditor) {

  function createSpanValue(value) {
    const spanField = getSpanType(blockEditor.props.type)
    const spanValue = blockEditor.context.formBuilder
      .createFieldValue(value, spanField.type)
    return spanValue
  }

  function createFieldValueFromHtml(element) {
    let value
    switch (element.tagName) {
      case 'a':
        value = createSpanValue({link: {href: element.attribs.href}})
        break
      default:
        value = undefined
    }
    return value
  }

  function resolveEnabledStyles() {
    return blockEditor.textStyles
      .map(style => style.value)
  }

  function resolveEnabledMarks() {
    return Object.keys(blockEditor.slateSchema.marks)
  }

  const deserializer = new HtmlDeserializer({
    enabledStyles: resolveEnabledStyles(),
    enabledMarks: resolveEnabledMarks(),
    createFieldValueFn: createFieldValueFromHtml
  })

  function onPaste(event, data, state, editor) {

    if (data.type != 'html') {
      return null
    }
    if (data.isShift) {
      return null
    }
    const {document} = deserializer.deserialize(
      data.html
    )
    return state
      .transform()
      .insertFragment(document)
      .apply()
  }

  return {
    onPaste
  }
}

export default onPasteHtml
