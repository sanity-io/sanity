function createOnKeyDown(blockEditor) {
  return function onKeyDown(event, data, change) {
    if (!data.isMod) {
      return null
    }

    let mark

    switch (data.key) {
      case 'b':
        mark = 'strong'
        break
      case 'i':
        mark = 'em'
        break
      case 'u':
        mark = 'underline'
        break
      default:
        return null
    }

    // Return if not supported by schema
    if (!blockEditor.slateSchema.marks[mark]) {
      return null
    }

    change.toggleMark(mark)

    event.preventDefault()
    return change
  }
}

function onModKeySetMarkCombos(blockEditor) {
  return {
    onKeyDown: createOnKeyDown(blockEditor)
  }
}

export default onModKeySetMarkCombos
