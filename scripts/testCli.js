/**
 * Standalone script to test that the sanity CLI command can run standalone
 * (without dependencies) and interact with a Sanity studio containing
 * `sanity`/`@sanity/core` as a dependency, using its included CLI commands.
 *
 * While we could script this using bash (and used to), this abstracts away
 * some OS-specifics like environment variables, temporary paths and whatnot
 * so we don't have to deal with the differences of powershell vs bash and such
 */

/* eslint-disable no-process-env, no-console, no-process-exit */
const os = require('os')
const path = require('path')
const util = require('util')
const {spawnSync, spawn} = require('child_process')
const {fetch} = require('undici')
const rimrafcb = require('rimraf')
const chalk = require('chalk')

const rimraf = util.promisify(rimrafcb)

/** Env setup / validation */
const env = {...process.env, SANITY_USE_PACKAGED_CLI: '1'}
const skipDelete = process.argv.includes('--skip-delete')
const tmpPath = process.env.RUNNER_TEMP || os.tmpdir()
const tmpProjectPath = path.join(tmpPath, 'test-project')
const githubWorkspace = process.env.GITHUB_WORKSPACE
const basePath = githubWorkspace || path.join(__dirname, '..')

/** Utility functions */
function spawnCommand(command, args, options = {}) {
  const cwd = options.cwd || process.cwd()

  console.log('')
  console.log(chalk.yellow(`[ Running '${command} ${args.join(' ')}' in '${cwd}' ]`))

  const start = Date.now()
  const result = spawnSync(command, args, {
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
  return rimraf(tmpProjectPath)
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

  // Allow running the Sanity CLI tool without specifying absolute path every time
  const binPath = path.join(basePath, 'packages', '@sanity', 'cli', 'bin', 'sanity')

  // Require a clean slate at startup
  cleanup()

  // Remove source and dependencies from CLI to ensure it works standalone
  if (!skipDelete) {
    const deletePaths = [
      path.join(basePath, 'packages', '@sanity', 'cli', 'node_modules'),
      path.join(basePath, 'packages', '@sanity', 'cli', 'src'),
      path.join(basePath, 'packages', '@sanity', 'cli', 'lib'),
    ]
    console.log(`Clearing directories: \n - ${deletePaths.join('\n - ')}`)
    await Promise.all(deletePaths.map((delPath) => rimraf(delPath)))
  }

  // Generate required scopes file for workshop in test-studio
  spawnCommand('npm', ['run', 'workshop:build'], {
    cwd: path.join(basePath, 'dev', 'test-studio'),
    stdio: 'inherit',
  })

  // Test `sanity build` command in test studio with all customizations
  spawnCommand(process.argv[0], [binPath, 'build', '-y'], {
    cwd: path.join(basePath, 'dev', 'test-studio'),
    stdio: 'inherit',
  })

  // Test `sanity init` command
  spawnCommand(
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
  spawnCommand(
    process.argv[0],
    [path.join(basePath, 'scripts', 'symlinkDependencies.js'), tmpProjectPath],
    {
      cwd: basePath,
      stdio: 'inherit',
    }
  )

  // Test `sanity build` but with the code from this checkout, not from latest npm release
  spawnCommand(process.argv[0], [binPath, 'build', '--no-minify'], {
    cwd: tmpProjectPath,
    stdio: 'inherit',
  })

  // Test `sanity start` in v3 studio
  await testStartCommand({binPath, cwd: tmpProjectPath, expectedTitle: 'Sanity Studio'})

  // Test running a v2 studio with the v3 cli (eg defers to @sanity/core)
  const v2Path = path.resolve(__dirname, '..', 'test', 'v2-studio')

  // npm install for v2 dependencies (eg dont want to symlink the monorepo modules)
  spawnCommand('npm', ['install'], {
    cwd: v2Path,
    stdio: 'inherit',
  })

  // Test `sanity build` in v2 context
  spawnCommand(process.argv[0], [binPath, 'build', '-y'], {
    cwd: v2Path,
    stdio: 'inherit',
  })

  // Test `sanity start` in v2 context
  await testStartCommand({binPath, cwd: v2Path, expectedTitle: 'v2 studio'})

  // Clean up after ourselves 😇
  await cleanup()
})().catch(async (error) => {
  console.error(error)
  await cleanup()
  process.exit(1)
})

function testStartCommand({binPath, cwd, expectedTitle}) {
  return new Promise((resolve, reject) => {
    const maxWaitForServer = 120000
    const startedAt = Date.now()
    let hasSucceeded = false
    let timer

    console.log('')
    console.log(chalk.yellow(`[ Running '${process.argv[0]} ${binPath} start' in '${cwd}' ]`))

    const proc = spawn(process.argv[0], [binPath, 'start'], {cwd, stdio: 'inherit'})
    proc.on('close', (code) => {
      if (!hasSucceeded && code && code > 0) {
        reject(new Error(`'sanity start' failed with code ${code}`))
      }
    })

    scheduleConnect()

    function scheduleConnect() {
      if (timer) {
        clearTimeout(timer)
      }

      if (Date.now() - startedAt > maxWaitForServer) {
        reject(new Error('Timed out waiting for server to get online'))
        return
      }

      timer = setTimeout(tryConnect, 1000)
    }

    async function tryConnect() {
      let res
      try {
        res = await fetch('http://localhost:3333/', {timeout: 500})
      } catch (err) {
        scheduleConnect()
        return
      }

      if (res.status !== 200) {
        proc.kill()
        reject(new Error(`Dev server responded with HTTP ${res.statusCode}`))
        return
      }

      const html = await res.text()
      if (html.includes(`<title>${expectedTitle}`)) {
        onSuccess()
        return
      }

      proc.kill()
      reject(new Error(`Did not find expected <title> in HTML:\n\n${html}`))
    }

    function onSuccess() {
      hasSucceeded = true
      clearTimeout(timer)
      const spentSecs = ((Date.now() - startedAt) / 1000).toFixed(2)
      console.log(chalk.yellow(`[ Dev server ready after %ss ]`), spentSecs)
      proc.kill()
      resolve()
    }
  })
}
