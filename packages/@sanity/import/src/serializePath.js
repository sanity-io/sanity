module.exports = function serializePath(item) {
  return item.path.reduce((target, part, i) => {
    const isIndex = typeof part === 'number'
    const seperator = i === 0 ? '' : '.'
    const add = isIndex ? `[${part}]` : `${seperator}${part}`
    return `${target}${add}`
  }, '')
}
