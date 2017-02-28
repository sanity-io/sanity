
function createOnKeyDown(blockEditor) {
  return function onKeyDown(event, data, state, editor) {
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

    const nextState = state
      .transform()
      .toggleMark(mark)
      .apply()

    event.preventDefault()
    return nextState
  }
}

function onModKeySetMarkCombos(blockEditor) {
  return {
    onKeyDown: createOnKeyDown(blockEditor)
  }
}

export default onModKeySetMarkCombos
