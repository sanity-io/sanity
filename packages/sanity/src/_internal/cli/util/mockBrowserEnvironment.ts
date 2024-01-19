import path from 'path'
import fs from 'fs'
import {addHook} from 'pirates'
import jsdomGlobal from 'jsdom-global'
import resolveFrom from 'resolve-from'
import {register as registerESBuild} from 'esbuild-register/dist/node'
import {ResizeObserver} from '@juggle/resize-observer'
import {init, parse} from 'es-module-lexer'

const jsdomDefaultHtml = `<!doctype html>
<html>
  <head><meta charset="utf-8"></head>
  <body></body>
</html>`

const extensionsToCompile = ['.jsx', '.ts', '.tsx', '.mjs', '.mts', '.cts']
const extensions = ['.js', '.cjs', ...extensionsToCompile]

export async function mockBrowserEnvironment(basePath: string): Promise<() => void> {
  await init

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
    (_code, filename) => `module.exports = ${JSON.stringify(filename)}`,
    {
      ignoreNodeModules: false,
      exts: getFileExtensions(),
    },
  )

  const {unregister: unregisterESBuild} = registerESBuild({
    target: 'node18',
    format: 'cjs',
    extensions,
    jsx: 'automatic',
    // for compat, this will also compile down some files from node_modules
    hookIgnoreNodeModules: false,
    // this function determines whether or not the file will be compiled via
    // esbuild. this environment is loaded via the node.js commonjs loader
    // and therefore any files that are not commonjs need to be compiled
    hookMatcher: (filePath) => {
      // if the file isn't located within node_modules, then compile it because
      // these files are likely the user's source files.
      if (!filePath.includes('node_modules')) return true

      // if the file is located within node_modules then we can assume it's
      // code that's at least prepared for distribution. however, these files
      // may still need to be compiled to commonjs so we check the file's
      // extension and short-circuit if the extension hints that it needs to be
      // compiled
      if (extensionsToCompile.includes(path.extname(filePath))) return true

      // otherwise, get the file and use `es-module-lexer` to determine if the
      // file has es module syntax. `es-module-lexer` library is written in C
      // and is compiled to WASM for performance
      try {
        // eslint-disable-next-line no-sync
        const code = fs.readFileSync(filePath, 'utf-8')

        // https://github.com/guybedford/es-module-lexer/tree/c357368bd4681011bc938ec54d48b2c6a969672b#esm-detection
        const [, , , hasModuleSyntax] = parse(code, filePath)
        return hasModuleSyntax
      } catch {
        // if there are parse errors from `es-module-lexer`, then compile it
        return true
      }
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
