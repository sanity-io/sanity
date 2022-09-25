import {addHook} from 'pirates'
import jsdomGlobal from 'jsdom-global'
import resolveFrom from 'resolve-from'
import {register as registerESBuild} from 'esbuild-register/dist/node'

const jsdomDefaultHtml = `<!doctype html>
<html>
  <head><meta charset="utf-8"></head>
  <body></body>
</html>`

export function mockBrowserEnvironment(basePath: string): () => void {
  // Guard against double-registering
  if (global && global.window && '__mockedBySanity' in global.window) {
    return () => {
      /* intentional noop */
    }
  }

  const domCleanup = jsdomGlobal(jsdomDefaultHtml, {url: 'http://localhost:3333/'})
  const windowCleanup = () => global.window.close()
  const globalCleanup = provideFakeGlobals(basePath)
  const cleanupFileLoader = addHook(
    (code, filename) => `module.exports = ${JSON.stringify(filename)}`,
    {
      ignoreNodeModules: false,
      exts: getFileExtensions(),
    }
  )

  const {unregister: unregisterESBuild} = registerESBuild({
    target: 'node14',
  })

  return function cleanupBrowserEnvironment() {
    unregisterESBuild()
    cleanupFileLoader()
    globalCleanup()
    windowCleanup()
    domCleanup()
  }
}

const getFakeGlobals = (basePath: string) => ({
  __mockedBySanity: true,
  requestAnimationFrame: setImmediate,
  cancelAnimationFrame: clearImmediate,
  requestIdleCallback: setImmediate,
  cancelIdleCallback: clearImmediate,
  InputEvent: global.window && global.window.InputEvent,
  ace: tryGetAceGlobal(basePath),
})

function provideFakeGlobals(basePath: string): () => void {
  const globalEnv = global as any as Record<string, unknown>
  const globalWindow = global.window as Record<string, any>

  const fakeGlobals = getFakeGlobals(basePath)
  const stubbedGlobalKeys: string[] = []
  const stubbedWindowKeys: string[] = []

  for (const [rawKey, value] of Object.entries(fakeGlobals)) {
    if (typeof value === 'undefined') {
      continue
    }

    const key = rawKey as keyof typeof fakeGlobals

    if (!(key in globalEnv)) {
      globalEnv[key] = fakeGlobals[key]
      stubbedGlobalKeys.push(key)
    }

    if (!(key in global.window)) {
      globalWindow[key] = fakeGlobals[key]
      stubbedWindowKeys.push(key)
    }
  }

  return () => {
    stubbedGlobalKeys.forEach((key) => {
      delete globalEnv[key]
    })

    stubbedWindowKeys.forEach((key) => {
      delete globalWindow[key]
    })
  }
}

function tryGetAceGlobal(basePath: string) {
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
    '.css',
  ]
}
