/**
 * Standalone script to test that the sanity CLI command can run standalone
 * (without dependencies) and interact with a Sanity studio containing
 * `@sanity/core` as a dependency, using its included CLI commands.
 *
 * While we could script this using bash (and used to), this abstracts away
 * some OS-specifics like environment variables, temporary paths and whatnot
 * so we don't have to deal with the differences of powershell vs bash and such
 */

/* eslint-disable no-process-env, no-console, no-process-exit */
const os = require('os')
const path = require('path')
const util = require('util')
const {spawnSync} = require('child_process')
const rimrafcb = require('rimraf')
const chalk = require('chalk')

const rimrafSync = rimrafcb.sync
const rimraf = util.promisify(rimrafcb)

/** Env setup / validation */
const env = {...process.env, SANITY_USE_PACKAGED_CLI: '1'}
const skipDelete = process.argv.includes('--skip-delete')
const tmpPath = process.env.RUNNER_TEMP || os.tmpdir()
const tmpProjectPath = path.join(tmpPath, 'test-project')
const githubWorkspace = process.env.GITHUB_WORKSPACE
const basePath = githubWorkspace || path.join(__dirname, '..')

/** Utility functions */
function spawn(filePath, args, options = {}) {
  const cwd = options.cwd || process.cwd()

  console.log('')
  console.log(chalk.yellow(`[ Running '${filePath} ${args.join(' ')}' in '${cwd}' ]`))

  const start = Date.now()
  const result = spawnSync(filePath, args, {
    windowsHide: true,
    ...options,
    env: {...env, ...options.env},
  })
  const spentSecs = ((Date.now() - start) / 1000).toFixed(2)

  if (result.error || result.status) {
    throw result.error || new Error(`Process exited with code ${result.status}`)
  }

  console.log(chalk.yellow(`[ Process exited successfully, spent %ss ]`), spentSecs)

  return result
}

function cleanup() {
  console.warn(`Clearing ${tmpProjectPath}`)
  rimrafSync(tmpProjectPath)
}

if (!githubWorkspace && !skipDelete) {
  throw new Error(
    'GITHUB_WORKSPACE not set, refusing to run as it will delete code! (use `--skip-delete` to run "safe" commands) '
  )
}

/** Actual CLI tests */
;(async function testCli() {
  // For debugging clarity
  console.log('Base path is %s', basePath)

  // Schedule cleanup tasks before exiting
  process.on('exit', cleanup)

  // Require a clean slate at startup
  cleanup()

  // Remove source and dependencies from CLI to ensure it works standalone
  if (!skipDelete) {
    await Promise.all([
      rimraf(path.join(basePath, 'packages', '@sanity', 'cli', 'node_modules')),
      rimraf(path.join(basePath, 'packages', '@sanity', 'cli', 'src')),
      rimraf(path.join(basePath, 'packages', '@sanity', 'cli', 'lib')),
    ])
  }

  // Allow running the Sanity CLI tool without specifying absolute path every time
  const binPath = path.join(basePath, 'packages', '@sanity', 'cli', 'bin', 'sanity')

  // Test `sanity build` command in test studio with all customizations
  spawn(process.argv[0], [binPath, 'build', '-y'], {
    cwd: path.join(basePath, 'dev', 'test-studio'),
    stdio: 'inherit',
  })

  // Test `sanity init` command
  spawn(
    process.argv[0],
    [
      binPath,
      'init',
      '-y',
      '--project',
      'ppsg7ml5',
      '--dataset',
      'test',
      '--output-path',
      tmpProjectPath,
    ],
    {
      cwd: tmpPath,
      stdio: 'inherit',
    }
  )

  // Replace @sanity-dependencies in the new project with symlinked versions instead
  // of the modules installed by npm/yarn
  spawn(
    process.argv[0],
    [path.join(basePath, 'scripts', 'symlinkDependencies.js'), tmpProjectPath],
    {
      cwd: basePath,
      stdio: 'inherit',
    }
  )

  // Test `sanity build` but with the code from this checkout, not from latest npm release
  spawn(process.argv[0], [binPath, 'build', '--no-minify'], {
    cwd: tmpProjectPath,
    stdio: 'inherit',
  })
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
