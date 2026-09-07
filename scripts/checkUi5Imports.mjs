import {readdir, readFile} from 'node:fs/promises'
import {extname, join, relative, sep} from 'node:path'
import process from 'node:process'

const ALLOWED_DIRECTORIES = new Set(['dev/test-studio', 'packages'])
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.turbo',
  'coverage',
  'dist',
  'lib',
  'node_modules',
  'storybook-static',
])
const SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'])
const UI5_IMPORT =
  /(?:^\s*(?:import|export)\s+(?:[^'"\n]*?\s+from\s+)?|(?:import|require)\s*\(\s*)['"]ui5(?:\/[^'"]*)?['"]/gm

const root = process.cwd()
const violations = []

function toPosixPath(path) {
  return path.split(sep).join('/')
}

function isAllowedDirectory(path) {
  return [...ALLOWED_DIRECTORIES].some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`),
  )
}

async function inspectDirectory(directory) {
  const entries = await readdir(directory, {withFileTypes: true})

  await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = join(directory, entry.name)
      const relativePath = toPosixPath(relative(root, absolutePath))

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !isAllowedDirectory(relativePath)) {
          await inspectDirectory(absolutePath)
        }
        return
      }

      if (!entry.isFile() || !SOURCE_EXTENSIONS.has(extname(entry.name))) return

      const source = await readFile(absolutePath, 'utf8')
      for (const match of source.matchAll(UI5_IMPORT)) {
        const line = source.slice(0, match.index).split('\n').length
        violations.push(`${relativePath}:${line}`)
      }
    }),
  )
}

await inspectDirectory(root)

if (violations.length > 0) {
  console.error(
    [
      'ui5 imports are only allowed in dev/test-studio and packages/**:',
      ...violations
        .toSorted((left, right) => left.localeCompare(right))
        .map((violation) => `  ${violation}`),
    ].join('\n'),
  )
  process.exitCode = 1
}
