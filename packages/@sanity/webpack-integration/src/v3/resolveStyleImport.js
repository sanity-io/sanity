const rp = require('fs.realpath')
const PAC = require('p-async-cache')
const resolveNodeModule = require('resolve')
const resolveParts = require('@sanity/resolver').resolveParts

const partsCache = new PAC({
  load: resolvePartsForPath,
  maxAge: 1000
})

const sanityCache = new PAC({
  load: resolveSanityImport,
  maxAge: 1000
})

const nodeCache = new PAC({
  load: resolveNodeImport,
  maxAge: 1000
})

function resolvePartsForPath(basePath) {
  return resolveParts({basePath})
}

function resolveNodeImport(moduleId, basedir) {
  return resolveModule(moduleId, {basedir})
}

function resolveSanityImport(id, basePath) {
  return partsCache.get(basePath).then(cached => {
    const parts = cached.value
    const loadAll = id.indexOf('all:') === 0
    const partName = loadAll ? id.substr(4) : id

    const part = parts.implementations[partName]
    if (!part) {
      throw new Error(`No implementers of part '${partName}'`)
    }

    const paths = part.map(implementer => realPath(implementer.path))
    return loadAll ? Promise.all(paths.reverse()) : paths[0]
  })
}

function isSanityPart(part) {
  return /^(all:)?part:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/.test(part)
}

function resolveModule(id, opts) {
  return new Promise((resolve, reject) => {
    resolveNodeModule(id, opts, (err, res) => {
      if (err) {
        reject(err)
        return
      }

      resolve(res)
    })
  })
}

function realPath(path) {
  return new Promise((resolve, reject) => {
    rp.realpath(path, (err, real) => {
      if (err) {
        reject(err)
        return
      }

      resolve(real)
    })
  })
}

function getStyleResolver(opts) {
  return function resolveStyleProxy(moduleId, basedir) {
    const id = moduleId.replace(/^\.\/(part|all:)/, '$1')
    const resolveStyleImport = isSanityPart(id)
      ? sanityCache.get(id, opts.from)
      : nodeCache.get(id, basedir)

    return resolveStyleImport.then(res => res.value)
  }
}

module.exports = getStyleResolver
