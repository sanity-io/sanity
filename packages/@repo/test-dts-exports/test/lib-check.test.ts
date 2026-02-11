/**
 * We can't just put `skipLibCheck: false` in the tsconfig.json because it doesn't let us filter out
 * errors that come from node_modules that we don't control.
 *
 * This test file use the TypeScript compiler directly, and allows us to filter out errors that we can't fix
 * limiting the scope of the errors to the files we control.
 */

import path from 'node:path'
import {fileURLToPath} from 'node:url'

import ts from 'typescript'
import {expect, test} from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const monorepoRoot = path.resolve(__dirname, '../../../..')
const cwd = path.resolve(__dirname, '..')
const configPath = ts.findConfigFile(cwd, ts.sys.fileExists, 'tsconfig.json')
if (!configPath) throw new Error("Can't find tsconfig.json")

const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
const tsconfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd)
const compilerOptions: ts.CompilerOptions = {
  ...tsconfig.options,
  // Enables type checking .d.ts files inside node_modules
  skipLibCheck: false,
  // Ensures that even though we call `program.emit` to get all diagnostics (ts.getPreEmitDiagnostics() only returns some errors) it won't actually emit files
  noEmit: true,
}

const program = ts.createProgram(tsconfig.fileNames, compilerOptions)
const emitResult = program.emit()

const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)
const errors = allDiagnostics.filter((diag) => diag.category === ts.DiagnosticCategory.Error)

/**
 * Filter out known false negatives that we either can't fix (because they originate in a third party library in node_modules),
 * or it's fixable but it'll take time to land the fix.
 * Feel free to add new false negatives to the list as you find them, just make sure to add context about the issue,
 * and wether the intention is to fix it or not.
 * If it originates from a sanity library the intention may be to fix it, but it shouldn't block the PR from landing.
 */
const filteredErrors = errors.filter((d) => {
  const {file, code, messageText} = d

  // We can't deal with errors without a file property so we don't skip over them
  if (!file) return true

  // We can't fix type issues in third party libraries
  if (file.fileName.includes('node_modules/@types/inquirer')) {
    return false
  }
  if (file.fileName.endsWith('node_modules/react-i18next/index.d.ts')) {
    return false
  }
  if (file.fileName.endsWith('node_modules/rollup/dist/rollup.d.ts')) {
    return false
  }
  if (file.fileName.endsWith('node_modules/slate-react/dist/components/text.d.ts')) {
    return false
  }
  if (file.fileName.endsWith('node_modules/vite/dist/node/index.d.ts')) {
    return false
  }

  // This error originates from a generated xstate machine declaration, so it's not code we can fix, it's a false negative
  if (
    file.fileName.includes('node_modules/@portabletext/editor/') &&
    code === 2488 &&
    messageText ===
      `Type 'never' must have a '[Symbol.iterator]()' method that returns an iterator.`
  ) {
    return false
  }

  // Handled in https://github.com/sanity-io/sanity/pull/9986
  if (
    (file.fileName.includes('packages/sanity/lib/_singletons.') ||
      file.fileName.includes('packages/sanity/lib/desk.')) &&
    (code === 2552 || code === 2304)
  ) {
    return false
  }

  // Handled in https://github.com/sanity-io/sanity/pull/9988
  if (file.fileName.includes('packages/sanity/lib/index.') && code === 2717) {
    return false
  }

  return true
})

test('skipLibCheck: false', () => {
  expect.hasAssertions()
  // Pretty print errors so it's easier to handle, the formatting matches what `tsc --noEmit` does
  filteredErrors.forEach((d) => {
    console.error(
      ts.formatDiagnosticsWithColorAndContext([d], {
        getCanonicalFileName: (f) => f,
        getCurrentDirectory: () => monorepoRoot,
        getNewLine: () => ts.sys.newLine,
      }),
    )
  })
  if (filteredErrors.length > 0) {
    expect(() => {
      throw new Error(
        'There are unexpected errors while checking the library typings. Check the logs above and update the filter conditions in this test file if needed.',
      )
    }).not.toThrow()
  } else {
    expect(filteredErrors).toHaveLength(0)
  }
})
