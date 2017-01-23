export default function insertEnter(state, patch) {
  let next = state
  const {document, startKey, startBlock} = state
  // For void blocks, we don't want to split. Instead we just move to the
  // start of the next text node if one exists.
  if (startBlock && startBlock.isVoid) {
    const text = document.getNextText(startKey)
    if (text) {
      next = next
        .transform()
        .collapseToStartOf(text)
        .apply()
    }
  }

  return next
    .transform()
    .splitBlock()
    .apply()
}
