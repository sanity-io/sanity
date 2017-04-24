import HtmlDeserializer from '../conversion/slateHTMLDeserializer'

function onPasteHtml(blockEditor) {

  function createFieldValueFromHtml(element) {
    return element.tagName.toLowerCase() === 'a'
      ? {link: {href: element.attribs.href}}
      : undefined
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
