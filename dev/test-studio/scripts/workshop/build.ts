import fs from 'fs'
import path from 'path'
import globby from 'globby'

const ROOT_PATH = path.resolve(__dirname, '../../../..')
const WORKSHOP_SRC_PATH = path.resolve(__dirname, '../../workshop')
const WORKSHOP_SCOPES_PATH = path.resolve(WORKSHOP_SRC_PATH, 'scopes.js')

const WORKSHOP_PATTERNS = [
  path.resolve(ROOT_PATH, 'packages/@sanity/*/src/**/__workshop__/index.ts'),
  path.resolve(ROOT_PATH, 'packages/@sanity/*/src/**/__workshop__/index.tsx'),
  path.resolve(ROOT_PATH, 'packages/*/src/**/__workshop__/index.ts'),
  path.resolve(ROOT_PATH, 'packages/*/src/**/__workshop__/index.tsx'),
]

// start watcher
build()

function build() {
  const scopeFiles = new Set<string>()

  const initialFilePaths = globby.sync(WORKSHOP_PATTERNS)

  for (const filePath of initialFilePaths) {
    scopeFiles.add(filePath)
  }

  _writeModule()

  function _writeModule() {
    fs.writeFileSync(WORKSHOP_SCOPES_PATH, compileModule(scopeFiles))

    // eslint-disable-next-line no-console
    console.log('[workshop] wrote scopes')
  }
}

function compileModule(pathSet: Set<string>) {
  const paths = [...pathSet]
  const sortedPaths = paths.sort()
  const imports = sortedPaths
    .map((p, idx) => `import _${idx} from '${sanitizeModulePath(p)}'`)
    .join('\n')
  const exports = sortedPaths.map((_p, idx) => `  _${idx}`).join(',\n')
  const code = `${[imports, `// prettier-ignore\nexport const scopes = [\n${exports},\n]`].join(
    '\n\n',
  )}\n`

  return code
}

function sanitizeModulePath(modulePath: string) {
  return path
    .relative(WORKSHOP_SRC_PATH, modulePath)
    .replace(/\.[^/.]+$/, '')
    .replace(/\/index$/, '')
}
