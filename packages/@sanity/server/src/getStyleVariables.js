import {resolveRoles} from '@sanity/resolver'
import isPlainObject from 'lodash/isPlainObject'
import merge from 'lodash/merge'

let resolving = false
const waiting = []
const roleName = 'variables:@sanity/base/theme'

function getStyleVariables(basePath) {
  if (resolving) {
    return new Promise((resolve, reject) => {
      waiting.push({resolve, reject})
    })
  }

  resolving = true
  return resolveRoles({basePath})
    .then(result => {
      const role = result.fulfilled[roleName] || []
      const implementations = role.map(impl => {
        const implementer = require(impl.path)
        const implementation = implementer.__esModule && implementer.default || implementer

        if (!isPlainObject(implementation)) {
          throw new Error(
            `Plugin "${impl.plugin}" implemented "${roleName}", but did not export a plain object`
          )
        }

        return implementation
      })

      const res = merge({}, ...implementations)

      while (waiting.length) {
        waiting.shift().resolve(res)
      }

      resolving = false
      return res
    })
    .catch(err => {
      while (waiting.length) {
        waiting.shift().reject(err)
      }

      resolving = false
    })
}

export default getStyleVariables
