const pirates = require('pirates')
const jsdomGlobal = require('jsdom-global')
const pluginLoader = require('@sanity/plugin-loader')
const requireContext = require('./requireContext')
const registerBabelLoader = require('./registerBabelLoader')

const getFakeGlobals = () => ({
  __DEV__: false,
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: (timer) => clearTimeout(timer),
  InputEvent: global.window && global.window.InputEvent,
})

function provideFakeGlobals() {
  const fakeGlobals = getFakeGlobals()
  const stubbedKeys = []
  Object.keys(fakeGlobals).forEach((key) => {
    if (!global[key]) {
      global[key] = fakeGlobals[key]
      stubbedKeys.push(key)
    }
  })

  return () => {
    stubbedKeys.forEach((key) => {
      delete global[key]
    })
  }
}

function mockBrowserEnvironment(basePath) {
  const domCleanup = jsdomGlobal()
  const windowCleanup = () => global.window.close()
  const globalCleanup = provideFakeGlobals()
  const contextCleanup = requireContext.register()
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
    contextCleanup()
    globalCleanup()
    windowCleanup()
    domCleanup()
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
