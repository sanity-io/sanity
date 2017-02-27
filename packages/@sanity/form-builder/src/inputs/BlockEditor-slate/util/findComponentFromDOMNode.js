export default function (DOMNode) {
  for (const key in DOMNode) {
    if (key.startsWith('__reactInternalInstance$')) {
      const compInternals = DOMNode[key]._currentElement
      const compWrapper = compInternals._owner
      const comp = compWrapper._instance
      return comp
    }
  }
  return null
}
