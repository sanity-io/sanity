import path from 'node:path'
import {fileURLToPath} from 'node:url'

import ts from 'typescript'
import {expect, test} from 'vitest'

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../sanity')
const configPath = path.join(packageDir, 'tsconfig.lib.json')
const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, packageDir)
const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options)
const checker = program.getTypeChecker()

test('the sanity root has no @internal exports', () => {
  expect(getInternalExports('src/_exports/index.ts')).toEqual([])
})

test('the private internals entry only has @internal exports', () => {
  const exports = getExportSymbols(
    'src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver.ts',
  )
  expect(exports.length).toBeGreaterThan(0)
  expect(exports.filter(({target}) => !hasInternalTag(target)).map(({name}) => name)).toEqual([])
})

function getInternalExports(relativePath: string): string[] {
  return getExportSymbols(relativePath)
    .filter(({target}) => hasInternalTag(target))
    .map(({name}) => name)
    .toSorted()
}

function getExportSymbols(relativePath: string): {name: string; target: ts.Symbol}[] {
  const sourceFile = program.getSourceFile(path.join(packageDir, relativePath))
  if (!sourceFile) {
    throw new Error(`Could not load ${relativePath}`)
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) {
    throw new Error(`Could not resolve exports from ${relativePath}`)
  }

  return checker.getExportsOfModule(moduleSymbol).map((symbol) => ({
    name: symbol.name,
    target: resolveAlias(symbol),
  }))
}

function hasInternalTag(symbol: ts.Symbol): boolean {
  return symbol.getJsDocTags(checker).some((tag) => tag.name === 'internal')
}

function resolveAlias(symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
}
