const pirates = require('pirates')
const jsdomGlobal = require('jsdom-global')
const resolveFrom = require('resolve-from')
const pluginLoader = require('@sanity/plugin-loader')
const registerBabelLoader = require('./registerBabelLoader')

const jsdomDefaultHtml = `<!doctype html>
<html>
  <head><meta charset="utf-8"></head>
  <body></body>
</html>`

const getFakeGlobals = (basePath) => ({
  __DEV__: false,
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: (timer) => clearTimeout(timer),
  InputEvent: global.window && global.window.InputEvent,
  ace: tryGetAceGlobal(basePath),
})

function provideFakeGlobals(basePath) {
  const fakeGlobals = getFakeGlobals(basePath)
  const stubbedGlobalKeys = []
  const stubbedWindowKeys = []
  Object.keys(fakeGlobals).forEach((key) => {
    if (typeof fakeGlobals[key] === 'undefined') {
      return
    }

    if (!global[key]) {
      global[key] = fakeGlobals[key]
      stubbedGlobalKeys.push(key)
    }

    if (!global.window[key]) {
      global.window[key] = fakeGlobals[key]
      stubbedWindowKeys.push(key)
    }
  })

  return () => {
    stubbedGlobalKeys.forEach((key) => {
      delete global[key]
    })

    stubbedWindowKeys.forEach((key) => {
      delete global.window[key]
    })
  }
}

function mockBrowserEnvironment(basePath) {
  const originalUrl = typeof URL === 'undefined' ? undefined : URL
  const domCleanup = jsdomGlobal(jsdomDefaultHtml, {url: 'http://localhost:3333/'})
  const windowCleanup = () => global.window.close()
  const globalCleanup = provideFakeGlobals(basePath)
  const cleanupFileLoader = pirates.addHook(
    (code, filename) => `module.exports = ${JSON.stringify(filename)}`,
    {
      ignoreNodeModules: false,
      exts: getFileExtensions(),
    }
  )

  registerBabelLoader(basePath)
  pluginLoader({basePath, stubCss: true})

  return function cleanupBrowserEnvironment() {
    cleanupFileLoader()
    globalCleanup()
    windowCleanup()
    domCleanup()

    // Restore original URL implementation if it was present earlier.
    // This is caused by jsdom-global replacing the global URL implementation,
    // and then removing it when cleaning up.
    if (originalUrl && typeof URL === 'undefined') {
      global.URL = originalUrl
    }
  }
}

function tryGetAceGlobal(basePath) {
  // Work around an issue where using the @sanity/code-input plugin would crash
  // due to `ace` not being defined on the global due to odd bundling stategy.
  const acePath = resolveFrom.silent(basePath, 'ace-builds')
  if (!acePath) {
    return undefined
  }

  try {
    // eslint-disable-next-line import/no-dynamic-require
    return require(acePath)
  } catch (err) {
    return undefined
  }
}

function getFileExtensions() {
  return [
    '.jpeg',
    '.jpg',
    '.png',
    '.gif',
    '.svg',
    '.webp',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.otf',
  ]
}

module.exports = mockBrowserEnvironment
