/**
 * Based heavily on https://github.com/webpack/webpack/blob/
 *  c0afdf9c6abc1dd70707c594e473802a566f7b6e/hot/only-dev-server.js
 * Original copyright Tobias Koppers @sokra (MIT license)
 */

/* eslint-disable complexity, no-console, camelcase, no-case-declarations, max-depth, @typescript-eslint/camelcase */
/* global __webpack_hash__ */

if (!module.hot) {
  throw new Error('[HMR] Hot Module Replacement is disabled.')
}

let lastHash
const failureStatuses = {abort: 1, fail: 1}
const applyOptions = {
  ignoreUnaccepted: true,
  ignoreDeclined: true,
  ignoreErrored: true,
  onUnaccepted(data) {
    console.warn(`Ignored an update to unaccepted module ${data.chain.join(' -> ')}`)
  },
  onDeclined(data) {
    console.warn(`Ignored an update to declined module ${data.chain.join(' -> ')}`)
  },
  onErrored(data) {
    console.warn(
      `Ignored an error while updating module ${data.moduleId} (${data.type}): ${data.error.message}`
    )
  },
}

function isUpToDate(hash) {
  if (hash) {
    lastHash = hash
  }

  return lastHash === __webpack_hash__
}

module.exports = function processUpdate(hash, moduleMap, callbacks = {}) {
  if (!isUpToDate(hash) && module.hot.status() === 'idle') {
    callbacks.handleCheckUpdate()
    check()
  }

  function check() {
    const cb = (err, updatedModules) => {
      if (err) {
        return handleError(err)
      }

      if (!updatedModules) {
        callbacks.handleUpdateNotFound()
        return null
      }

      const applyCallback = (applyErr, renewedModules) => {
        if (applyErr) {
          handleError(applyErr)
          return
        }

        if (!isUpToDate()) {
          check()
        }

        logUpdates(updatedModules, renewedModules)
        triggerCallbacks(updatedModules, renewedModules)
      }

      const options = {
        ...applyOptions,
        onErrored: (...args) => {
          applyOptions.onErrored(...args)
          callbacks.handleError(...args)
        },
        onDeclined: (...args) => {
          applyOptions.onDeclined(...args)
          callbacks.handleError(...args)
        },
        onUnaccepted: (...args) => {
          applyOptions.onUnaccepted(...args)
          callbacks.handleUnaccepted(...args)
        },
      }

      const applyResult = module.hot.apply(options, applyCallback)
      // webpack 2 promise
      if (applyResult && applyResult.then) {
        // HotModuleReplacement.runtime.js refers to the result as `outdatedModules`
        applyResult.then((outdatedModules) => applyCallback(null, outdatedModules))
        applyResult.catch(applyCallback)
      }

      return undefined
    }

    const result = module.hot.check(false, cb)
    // webpack 2 promise
    if (result && result.then) {
      result.then((updatedModules) => cb(null, updatedModules))
      result.catch(cb)
    }
  }

  function logUpdates(updatedModules, renewedModules) {
    const unacceptedModules = updatedModules.filter(
      (moduleId) => renewedModules && renewedModules.indexOf(moduleId) < 0
    )

    if (unacceptedModules.length > 0) {
      console.warn(
        "[HMR] The following modules couldn't be hot updated: " +
          '(Full reload needed)\n' +
          'This is usually because the modules which have changed ' +
          '(and their parents) do not know how to hot reload themselves. '
      )
      unacceptedModules.forEach((moduleId) => {
        console.warn(`[HMR]  - ${normalizeModulePath(moduleMap[moduleId] || moduleId).path}`)
      })

      return
    }

    if (!renewedModules || renewedModules.length === 0) {
      console.log('[HMR] Nothing hot updated.')
    } else {
      console.log('[HMR] Updated modules:')
      renewedModules.forEach((moduleId) => {
        console.log(`[HMR]  - ${normalizeModulePath(moduleMap[moduleId] || moduleId).path}`)
      })
    }

    if (isUpToDate()) {
      console.log('[HMR] App is up to date.')
    }
  }

  function triggerCallbacks(updatedModules, renewedModules) {
    const unacceptedModules = updatedModules.filter(
      (moduleId) => renewedModules && renewedModules.indexOf(moduleId) < 0
    )

    if (unacceptedModules.length > 0) {
      callbacks.handleUnaccepted({
        modules: unacceptedModules.map((moduleId) =>
          normalizeModulePath(moduleMap[moduleId] || moduleId)
        ),
      })
      return
    }

    if (!renewedModules || renewedModules.length === 0) {
      callbacks.handleNothingUpdated()
    } else {
      callbacks.handleUpdated({
        modules: renewedModules.map((moduleId) =>
          normalizeModulePath(moduleMap[moduleId] || moduleId)
        ),
      })
    }

    if (isUpToDate()) {
      callbacks.handleUpToDate()
    }
  }

  function handleError(err) {
    if (module.hot.status() in failureStatuses) {
      callbacks.handleError({error: err})
      return
    }

    callbacks.handleUpdateCheckFailed({error: err})
  }

  function normalizeModulePath(pathName) {
    if (typeof pathName !== 'string') {
      return {path: '<unknown>'}
    }

    const [path, partName] = pathName.split('?sanityPart=')
    return {path, partName: partName && decodeURIComponent(partName)}
  }
}
