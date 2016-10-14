function onKeyDown(event, data, state, editor) {
  if (!data.isMod) {
    return null
  }

  let mark

  switch (data.key) {
    case 'b':
      mark = 'bold'
      break
    case 'i':
      mark = 'italic'
      break
    case 'u':
      mark = 'underline'
      break
    default:
      return null
  }
  const nextState = state
    .transform()
    .toggleMark(mark)
    .apply()

  event.preventDefault()
  return nextState
}

function TextFormattingOnKeyDown(...args) {
  return {
    onKeyDown
  }
}

export default TextFormattingOnKeyDown
