/* eslint-disable no-process-exit, no-sync */
const childProcess = require('child_process')
const path = require('path')
const fs = require('fs')
const mods = require('../../actions/codemod/mods')

const helpText = `
Runs a given code modification script on the current studio folder.
Running the command without a specified codemod name will list available transformations.

Options
  --dry Dry run (no changes are made to files)
  --extensions=EXT Transform files with these file extensions (comma separated list)
                   (default: js,ts,tsx)
  --no-verify Skips verification steps before running codemod

Examples
  # Show available code mods
  sanity codemod

  # Run codemod to transform react-icons imports from v2 style to v3 style,
  # but only as a dry-run (do not write the files)
  sanity codemod reactIconsV3 --dry

`

export default {
  name: 'codemod',
  signature: '[CODEMOD_NAME]',
  description: 'Runs a code modification script',
  helpText,
  async action(args, context) {
    const {output, cliRoot, workDir} = context
    const [name] = args.argsWithoutOptions
    const cliFlags = args.extOptions
    if (!name) {
      printMods(output)
      return
    }

    const modNames = Object.keys(mods).reduce((lowercased, orgName) => {
      lowercased[orgName.toLowerCase()] = orgName
      return lowercased
    }, {})

    const modName = modNames[name.toLowerCase()]
    if (!modName) {
      throw new Error(`Codemod with name "${name}" not found`)
    }

    const mod = mods[modName]
    if (typeof mod.verify === 'function' && cliFlags.verify !== false) {
      await mod.verify(context)
    }

    const exts = cliFlags.extensions
      ? cliFlags.extensions.split(',').map((ext) => ext.trim().replace(/^\./, ''))
      : ['js', 'ts', 'tsx']

    const dryRun = Boolean(typeof cliFlags.dry === 'undefined' ? false : cliFlags.dry)

    ensureNpx()

    const hasGitIgnore = fs.existsSync(path.join(workDir, '.gitignore'))

    const modPath = path.resolve(path.join(cliRoot, 'codemods', `${modName}.js`))
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
    ].filter(Boolean)

    const child = childProcess.spawn('npx', cmdArgs, {
      stdio: 'inherit',
    })

    process.on('SIGINT', () => {
      child.kill(2)
    })

    child.on('close', (code) => {
      process.exit(code)
    })
  },
}

function printMods(output) {
  output.print('Available code modifications:\n')

  Object.keys(mods).forEach((modName) => {
    const mod = mods[modName]
    output.print(`${modName} - ${mod.purpose}`)
  })
}

function ensureNpx() {
  try {
    const npxHelp = childProcess.execSync('npx --help', {encoding: 'utf8'})
    if (!npxHelp.includes('npm')) {
      throw new Error('Not the npx we expected')
    }
  } catch (err) {
    throw new Error(
      `Failed to run "npx" - required to run codemods. Do you have a recent version of npm installed?`
    )
  }
}
