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
  const {file, code} = d

  // We can't deal with errors without a file property so we don't skip over them
  if (!file) return true

  // Temporary workaround for broken d.ts output in @sanity/sdk's dist/ (still reproduced with the
  // latest stable 2.14.1). The generated declarations import from '../_exports', which TypeScript
  // can't resolve because dist/_exports/ ships no index.d.ts. This only affects type checking in
  // node_modules and does not impact runtime behavior. The d.ts emit is fixed in @sanity/sdk v3, so
  // this filter can be removed once the monorepo upgrades to it (or @sanity/sdk backports the fix).
  if (code === 2307 && file.fileName.includes('/node_modules/@sanity/sdk/dist/')) {
    return false
  }

  // Temporary workaround for broken d.ts output in @sanity/workbench (reproduced with
  // 0.1.0-alpha.24 and 0.1.0-alpha.25). The bundled declarations emit the same type alias twice
  // (e.g. Canvas, Workspace), which fails TS2300 under skipLibCheck: false. This only affects type
  // checking in node_modules and does not impact runtime behavior. Remove once @sanity/workbench
  // ships a release without duplicate identifiers in its generated .d.ts files.
  if (code === 2300 && file.fileName.includes('/node_modules/@sanity/workbench/')) {
    return false
  }

  // @sanity/pkg-utils@11 / rolldown-plugin-dts emits a bare `import "get-it"` side-effect in
  // @sanity/vision's bundled declarations (transitive via @sanity/client). get-it is not a direct
  // dependency of vision, so TypeScript cannot resolve it from the published package graph
  // (TS2882). Runtime is unaffected; remove once dts emit stops leaking that import.
  if (code === 2882 && file.fileName.includes('/packages/@sanity/vision/lib/')) {
    return false
  }

  // quick-lru@7.3.0 declares Map subclass methods returning IterableIterator, which is not
  // assignable to MapIterator under TypeScript 6+ (TS2416). Third-party; not actionable here.
  if (code === 2416 && file.fileName.includes('/node_modules/quick-lru/')) {
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
