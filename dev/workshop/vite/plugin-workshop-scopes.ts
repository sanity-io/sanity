import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'
import globby from 'globby'
import {ResolvedConfig} from 'vite'

const ROOT_PATH = path.resolve(__dirname, '../../..')
const WORKSHOP_SRC_PATH = path.resolve(__dirname, '../src')
const WORKSHOP_PATTERNS = [
  path.resolve(ROOT_PATH, 'packages/@sanity/*/src/**/__workshop__/index.ts'),
  path.resolve(ROOT_PATH, 'packages/@sanity/*/src/**/__workshop__/index.tsx'),
]

const WORKSHOP_SCOPES_PATH = path.resolve(WORKSHOP_SRC_PATH, 'scopes.js')

declare global {
  // eslint-disable-next-line no-var
  var $workshopWatcher: chokidar.FSWatcher | undefined
}

function sanitizeModulePath(modulePath: string) {
  return path
    .relative(WORKSHOP_SRC_PATH, modulePath)
    .replace(/\.[^/.]+$/, '')
    .replace(/\/index$/, '')
}

function compileModule(paths: string[]) {
  const sortedPaths = paths.sort()
  const imports = sortedPaths
    .map((p, idx) => `import _${idx} from '${sanitizeModulePath(p)}'`)
    .join('\n')
  const exports = sortedPaths.map((_p, idx) => `  _${idx}`).join(',\n')
  const code = `${[imports, `export const scopes = [\n${exports},\n]`].join('\n\n')}\n`

  return code
}

export function pluginWorkshopScopes() {
  let paths: string[] = []
  let isInitialized = false
  let isWatcherInitialized = false
  let shouldWatch = true

  return {
    name: 'workshop-scopes',

    configResolved(config: ResolvedConfig) {
      shouldWatch = config.command !== 'build'
    },

    resolveId() {
      if (!isInitialized) {
        _init()
      }

      if (shouldWatch && !isWatcherInitialized) {
        _initWatcher()
      }

      return undefined
    },
  }

  function _init() {
    isInitialized = true

    paths = globby.sync(WORKSHOP_PATTERNS)

    _writeModule()
  }

  function _initWatcher() {
    isWatcherInitialized = true

    if (global.$workshopWatcher) {
      global.$workshopWatcher.close()
    }

    global.$workshopWatcher = chokidar.watch(WORKSHOP_PATTERNS, {
      ignoreInitial: true,
    })

    global.$workshopWatcher.on('all', (event, filePath) => {
      if (event === 'add') {
        if (!paths.includes(filePath)) {
          paths.push(filePath)
          paths.sort()
        }

        _writeModule()
      }

      if (event === 'unlink') {
        const idx = paths.indexOf(filePath)

        if (idx > -1) {
          paths.splice(idx)
        }

        _writeModule()
      }
    })
  }

  function _writeModule() {
    fs.writeFileSync(WORKSHOP_SCOPES_PATH, compileModule(paths))
  }
}
