import {resolveParts as resolveSanityParts} from '@sanity/resolver'
import resolveNodeModule from 'resolve'

const resolveParts = canonicalize(resolveSanityParts)

function resolveStyleImports(id, basedir, opts) {
  if (!isSanityPart(id)) {
    return resolveModule(id, basedir, opts)
  }

  return resolveParts({basePath: opts.root})
    .then(parts => {
      const loadAll = id.indexOf('all:') === 0
      const partName = loadAll ? id.substr(4) : id

      const part = parts.implementations[partName]
      if (!part) {
        throw new Error(`No implementers of part '${partName}'`)
      }

      const paths = part.map(implementer => implementer.path)
      return loadAll
        ? paths.reverse()
        : paths[0]
    })
}

/**
 * Resolve operations are quite IO-intensive, and there is little chance of parts
 * changing multiple times per second. To reduce the load on the filesystem,
 * we canonicalize the lookups. Basically: If a resolve operations is currently
 * underway, don't do another resolve operation - instead, wait for the first
 * resolve operation to complete, then return the result.
 *
 * This function shouldn't be used in cases where the arguments vary.
 * In this case, once the Sanity server is running, the root path shouldn't change,
 * which is the only argument we really care about. Eg: "safe"
 */
function canonicalize(fn) {
  let pending
  return (...args) => {
    if (!pending) {
      pending = fn(...args).then(val => {
        pending = null
        return val
      }, err => {
        pending = null
        return Promise.reject(err)
      })
    }

    return pending
  }
}

function resolveModule(id, basedir, opts) {
  const resolveOpts = {
    basedir: basedir,
    paths: opts.path,
    extensions: ['.css'],
    packageFilter: pkg => {
      if (pkg.style) {
        pkg.main = pkg.style
      } else if (!pkg.main || !/\.css$/.test(pkg.main)) {
        pkg.main = 'index.css'
      }
      return pkg
    }
  }

  return new Promise((resolve, reject) => {
    resolveNodeModule(id, resolveOpts, (err, path) => {
      return err
        ? reject(err)
        : resolve(path)
    })
  })
}

function isSanityPart(part) {
  return part.match(/^(all:)?part:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/)
}

export default resolveStyleImports
