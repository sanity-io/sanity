import HtmlDeserializer from '../conversion/slateHTMLDeserializer'

function onPasteHtml(blockEditor) {

  function resolveEnabledStyles() {
    return blockEditor.textStyles
      .map(style => style.value)
  }

  function resolveEnabledAnnotationTypes() {
    return blockEditor.annotationTypes.map(type => type.name)
  }

  function resolveEnabledDecorators() {
    return Object.keys(blockEditor.slateSchema.marks)
  }

  const deserializer = new HtmlDeserializer({
    enabledStyles: resolveEnabledStyles(),
    enabledDecorators: resolveEnabledDecorators(),
    enabledAnnotations: resolveEnabledAnnotationTypes()
  })

  function onPaste(event, data, change) {
    if (data.type != 'html') {
      return null
    }
    if (data.isShift) {
      return null
    }
    const {document} = deserializer.deserialize(
      data.html
    )
    return change.insertFragment(document)
  }

  return {
    onPaste
  }
}

export default onPasteHtml
