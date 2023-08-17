/* eslint-disable no-process-exit, no-sync */
import childProcess from 'child_process'
import path from 'path'
import fs from 'fs'
import type {CliCommandAction, CliCommandContext} from '../../types'
import type {CodeMod} from './types'
import mods from './mods'

export interface CodeModFlags {
  extensions?: string
  verify?: boolean
  dry?: boolean
}

export const codemodAction: CliCommandAction<CodeModFlags> = async function codemodAction(
  args,
  context,
) {
  const {output, cliRoot, workDir} = context
  const [name] = args.argsWithoutOptions
  const cliFlags = args.extOptions
  if (!name) {
    printMods(output)
    return
  }

  // Make a record where all the keys of the available codemods are lowercased,
  // eg `reactIconsV3` turns into `{reacticonsv3: CodeMod}`
  const normalizedMods: Record<string, CodeMod> = {}
  for (const [originalName, mod] of Object.entries(mods)) {
    normalizedMods[originalName.toLowerCase()] = mod
  }

  // Verify that mod exists
  const mod = normalizedMods[name.toLowerCase()]
  if (!mod) {
    throw new Error(`Codemod with name "${name}" not found`)
  }

  // Verify if there is any verification deefined, and user has not opted out of it
  if (typeof mod.verify === 'function' && cliFlags.verify !== false) {
    await mod.verify(context)
  }

  // If extensions are defined, they come in as CSV, so split and normalize them
  const exts = cliFlags.extensions
    ? cliFlags.extensions.split(',').map((ext) => ext.trim().replace(/^\./, ''))
    : ['js', 'ts', 'tsx']

  const dryRun = Boolean(typeof cliFlags.dry === 'undefined' ? false : cliFlags.dry)

  // We use npx to run jscodeshift, so verify that it exists and works before using it
  ensureNpx()

  // If there is a gitignore in the target folder, we want to use that to know
  // which folders to ignore - eg `dist`, `coverage` or whatever
  const hasGitIgnore = fs.existsSync(path.join(workDir, '.gitignore'))

  // Build the CLI command arguments
  const modPath = path.resolve(path.join(cliRoot, 'codemods', mod.filename))
  const cmdArgs = [
    'jscodeshift',
    '--ignore-pattern',
    'node_modules',
    '--ignore-pattern',
    'dist',
    hasGitIgnore && '--ignore-config',
    hasGitIgnore && '.gitignore',
    '-t',
    modPath,
    '--extensions',
    exts.join(','),
    dryRun && '--dry',
    workDir,
  ].filter((item): item is string => typeof item === 'string')

  const child = childProcess.spawn('npx', cmdArgs, {
    stdio: 'inherit',
  })

  process.on('SIGINT', () => {
    child.kill(2)
  })

  child.on('close', (code) => {
    process.exit(code || undefined)
  })
}
function printMods(output: CliCommandContext['output']) {
  output.print('Available code modifications:\n')

  for (const [modName, mod] of Object.entries(mods)) {
    output.print(`${modName} - ${mod.purpose}`)
  }
}

function ensureNpx() {
  try {
    const npxHelp = childProcess.execSync('npx --help', {encoding: 'utf8'})
    if (!npxHelp.includes('npm')) {
      throw new Error('Not the npx we expected')
    }
  } catch (err) {
    throw new Error(
      `Failed to run "npx" - required to run codemods. Do you have a recent version of npm installed?`,
    )
  }
}
