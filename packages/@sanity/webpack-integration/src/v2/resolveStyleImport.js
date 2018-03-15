const resolveParts = require('@sanity/resolver').resolveParts
const resolveNodeModule = require('resolve')

function resolveStyleImport(moduleId, opts) {
  const id = moduleId.replace(/^\.\/(part|all:)/, '$1')
  if (!isSanityPart(id)) {
    return resolveNodeModule.sync(id, opts)
  }

  const parts = resolveParts({basePath: opts.root, sync: true})
  const loadAll = id.indexOf('all:') === 0
  const partName = loadAll ? id.substr(4) : id

  const part = parts.implementations[partName]
  if (!part) {
    throw new Error(`No implementers of part '${partName}'`)
  }

  const paths = part.map(implementer => implementer.path)
  return loadAll ? paths.reverse() : paths[0]
}

function isSanityPart(part) {
  return /^(all:)?part:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/.test(part)
}

module.exports = function getStyleResolver(opts) {
  return function resolveStyleProxy(moduleId, basedir, styleOptions) {
    return resolveStyleImport(moduleId, Object.assign({root: opts.from, basedir}, styleOptions))
  }
}
