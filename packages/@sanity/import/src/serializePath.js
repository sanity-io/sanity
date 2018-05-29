module.exports = function serializePath(item) {
  return item.path.reduce((target, part, i) => {
    const isIndex = typeof part === 'number'
    const isNumericStringKey = !isIndex && isFinite(part)
    const seperator = i === 0 ? '' : '.'
    if (!isIndex && !isNumericStringKey) {
      return `${target}${seperator}${part}`
    }

    const add = isIndex ? `[${part}]` : `["${part}"]`
    return `${target}${add}`
  }, '')
}
