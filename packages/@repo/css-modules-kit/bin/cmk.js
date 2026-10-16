#!/usr/bin/env node
/**
 * css-modules-kit's `cmk`, resolved from this package so that it runs against this package's
 * `typescript`: the TypeScript 6 compiler API, which cmk reads `tsconfig.json` and resolves
 * modules with, and which TypeScript 7 does not ship.
 *
 * `--check` adds what upstream lacks, a staleness check: it fails when a typings file in
 * `cmkOptions.dtsOutDir` is missing, stale or orphaned, listing each one. It leaves that directory
 * alone, so other checks can read it at the same time: cmk's own `runCMK` generates the typings
 * into a scratch directory under the project's `node_modules/.cache`, which they are compared with.
 */
import {mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {styleText} from 'node:util'

import {
  createLogger,
  parseCLIArgs,
  runCMK,
  shouldBePretty,
} from '@css-modules-kit/codegen/dist/index.js'
import {readConfigFile} from '@css-modules-kit/core'

/** The `cmkOptions` that shape the generated typings, which the scratch tsconfig must inherit */
const inheritedOptions = [
  'enabled',
  'arbitraryExtensions',
  'namedExports',
  'prioritizeNamedImports',
  'animation',
  'dashedIdents',
  'container',
]

const argv = process.argv.slice(2)

if (argv.includes('--check')) {
  const cwd = process.cwd()
  let logger = createLogger(cwd, shouldBePretty(undefined))
  try {
    const args = parseCLIArgs(
      argv.filter((arg) => arg !== '--check'),
      cwd,
    )
    logger = createLogger(cwd, shouldBePretty(args.pretty))
    process.exitCode = (await check(args, logger)) ? 0 : 1
  } catch (error) {
    logger.logError(error)
    process.exitCode = 1
  }
} else {
  await import('@css-modules-kit/codegen/bin/cmk.js')
}

async function check(args, logger) {
  const options = readConfigFile(args.project)
  const {basePath, configFileName, dtsOutDir} = options
  const scratch = path.join(basePath, 'node_modules', '.cache', `cmk-check-${process.pid}`)
  const scratchConfig = path.join(scratch, 'tsconfig.json')
  // cmk writes `<dtsOutDir>/<CSS module path relative to the tsconfig>.d.ts`, with `dtsOutDir`
  // relative to the tsconfig too. A `dtsOutDir` as many levels below the scratch tsconfig as that
  // sits below the project's puts the typings at `<scratch>/<path relative to the project>.d.ts`,
  // the layout they have in the real `dtsOutDir`
  const depth = path.relative(basePath, scratch).split(path.sep).length
  let generated
  try {
    await mkdir(scratch, {recursive: true})
    await writeFile(
      scratchConfig,
      JSON.stringify({
        extends: path.relative(scratch, configFileName),
        cmkOptions: {dtsOutDir: Array.from({length: depth}, (_, level) => `${level}`).join('/')},
      }),
    )
    // cmk merges `cmkOptions` key by key through `extends`, so only `dtsOutDir` changes
    const scratchOptions = readConfigFile(scratchConfig)
    const lost = inheritedOptions.filter((key) => scratchOptions[key] !== options[key])
    if (lost.length > 0) throw new Error(`The scratch tsconfig lost cmkOptions: ${lost.join(', ')}`)
    if (!(await runCMK({...args, project: scratchConfig, clean: true}, logger))) return false
    generated = await readTree(scratch)
    generated.delete('tsconfig.json')
  } finally {
    await rm(scratch, {recursive: true, force: true})
  }
  const existing = await readTree(dtsOutDir)

  const problems = []
  for (const [file, text] of generated) {
    if (!existing.has(file)) problems.push([file, 'Missing'])
    else if (existing.get(file) !== text) problems.push([file, 'Out of date with its CSS module'])
  }
  for (const file of existing.keys()) {
    if (!generated.has(file)) problems.push([file, 'Its CSS module no longer exists'])
  }
  if (problems.length === 0) return true

  const root = process.env['GITHUB_WORKSPACE'] ?? process.env['INIT_CWD'] ?? process.cwd()
  for (const [file, problem] of problems.toSorted(([a], [b]) => a.localeCompare(b))) {
    const relative = path.relative(root, path.join(dtsOutDir, file))
    if (process.env['GITHUB_ACTIONS']) console.error(`::error file=${relative}::${problem}`)
    console.error(`${styleText('bold', relative)} ${styleText('red', problem)}`)
  }
  console.error(`\nRun \`cmk\` in ${path.relative(root, process.cwd()) || '.'} to regenerate them.`)
  return false
}

/** Every file below `dir`, by path relative to it. A missing `dir` is an empty tree. */
async function readTree(dir) {
  const entries = await readdir(dir, {recursive: true, withFileTypes: true}).catch((error) => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)))
  return new Map(
    await Promise.all(
      files.map(async (file) => [file, await readFile(path.join(dir, file), 'utf8')]),
    ),
  )
}
