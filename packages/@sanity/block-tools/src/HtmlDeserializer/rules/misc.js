function isPastedFromGoogleDocs(el) {
  if (el.nodeType !== 1) {
    return false
  }
  const id = el.getAttribute('id')
  return id && id.match(/^docs-internal-guid-/)
}

export default function createMiscRules(blockContentType) {
  return [
    // Special rule for Google Docs which always
    // wrap the html data in a <b> tag :/
    {
      deserialize(el, next) {
        if (isPastedFromGoogleDocs(el)) {
          return next(el.childNodes)
        }
        return undefined
      }
    }
  ]
}
