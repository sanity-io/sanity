export default function insertText(state, patch) {
  let next = state
  if (patch.insertText) {
    next = next
      .transform()
      .insertText(patch.insertText)
      .apply()

    if (patch.isNative) {
      next = next.merge({isNative: true})
    }
  }
  return next
}
