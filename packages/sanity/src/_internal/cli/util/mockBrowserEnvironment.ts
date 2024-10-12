import {ResizeObserver} from '@juggle/resize-observer'
import {register as registerESBuild} from 'esbuild-register/dist/node'
import jsdomGlobal from 'jsdom-global'
import {addHook} from 'pirates'
import resolveFrom from 'resolve-from'

import {getStudioEnvironmentVariables} from '../server/getStudioEnvironmentVariables'

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
    },
  )

  const {unregister: unregisterESBuild} = registerESBuild({
    target: 'node18',
    supported: {'dynamic-import': true},
    format: 'cjs',
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
    jsx: 'automatic',
    define: {
      // define the `process.env` global
      ...getStudioEnvironmentVariables({prefix: 'process.env.', jsonEncode: true}),
      // define the `import.meta.env` global
      ...getStudioEnvironmentVariables({prefix: 'import.meta.env.', jsonEncode: true}),
    },
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
  ace: tryGetAceGlobal(basePath),
  InputEvent: global.window?.InputEvent,
  customElements: global.window?.customElements,
  ResizeObserver: global.window?.ResizeObserver || ResizeObserver,
  matchMedia:
    global.window?.matchMedia ||
    (() => ({
      matches: false,
      media: '',
      onchange: null,
    })),
})

const getFakeDocumentProps = () => ({
  execCommand: function execCommand(
    // Provide the right arity for the function, even if unused
    /* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */
    _commandName: string,
    _showDefaultUI: boolean,
    _valueArgument: unknown,
    /* eslint-enable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */
  ) {
    // Return false to indicate "unsupported"
    return false
  },
})

function provideFakeGlobals(basePath: string): () => void {
  const globalEnv = global as any as Record<string, unknown>
  const globalWindow = global.window as Record<string, any>
  const globalDocument = (global.document || document || {}) as Record<string, any>

  const fakeGlobals = getFakeGlobals(basePath)
  const fakeDocumentProps = getFakeDocumentProps()

  const stubbedGlobalKeys: string[] = []
  const stubbedWindowKeys: string[] = []
  const stubbedDocumentKeys: string[] = []

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

  for (const [rawKey, value] of Object.entries(fakeDocumentProps)) {
    if (typeof value === 'undefined') {
      continue
    }

    const key = rawKey as keyof typeof fakeDocumentProps
    if (!(key in globalDocument)) {
      globalDocument[key] = fakeDocumentProps[key]
      stubbedDocumentKeys.push(key)
    }
  }

  return () => {
    stubbedGlobalKeys.forEach((key) => {
      delete globalEnv[key]
    })

    stubbedWindowKeys.forEach((key) => {
      delete globalWindow[key]
    })

    stubbedDocumentKeys.forEach((key) => {
      delete globalDocument[key]
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
    '.css',
    '.eot',
    '.gif',
    '.jpeg',
    '.jpg',
    '.otf',
    '.png',
    '.sass',
    '.scss',
    '.svg',
    '.ttf',
    '.webp',
    '.woff',
    '.woff2',
  ]
}
