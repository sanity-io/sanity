import {spawn, type SpawnOptions} from 'node:child_process'
import {existsSync, readFileSync} from 'node:fs'
import {platform, tmpdir} from 'node:os'
import path from 'node:path'

import {createClient} from '@sanity/client'
import which from 'which'

export const cliUserToken = (process.env.SANITY_CI_CLI_AUTH_TOKEN_STAGING || '').trim()
export const cliProjectId = '1d4femd5'
export const cliApiHost = 'https://api.sanity.work'

export const hasBuiltCli = existsSync(path.join(__dirname, '..', '..', 'lib', 'cli.js'))
export const fixturesPath = path.join(__dirname, '..', '__fixtures__')
export const studioVersions = ['v3'] as const
export const doCleanup = false
export const baseTestPath = path.join(tmpdir(), 'sanity-cli-test')
export const testIdPath = path.join(baseTestPath, 'test-id.txt')
export const studiosPath = path.join(baseTestPath, 'studios')
export const packPath = path.join(baseTestPath, 'packs')
export const cliInstallPath = path.join(baseTestPath, 'install')
export const cliBinPath = path.join(cliInstallPath, 'node_modules', '.bin', 'sanity')
export const {NODE_ENV, ...envLessEnv} = process.env
export const sanityEnv = {...envLessEnv, XDG_CONFIG_HOME: path.join(baseTestPath, 'config')}
export const cliConfigPath = path.join(sanityEnv.XDG_CONFIG_HOME, 'sanity-staging', 'config.json')
export const nodeMajorVersion = process.version.split('.')[0]
export const npmPath = which.sync('npm')
// note: we use pnpm for `pack`, because npm doesn't rewrite `workspace:*` protocols
export const pnpmPath = which.sync('pnpm')
export const nodePath = process.execPath

// We don't need a super precise timestamp, but enough to include hours (for dangling cleanup)
const testIdTimestamp =
  process.env.SANITY_CLI_TEST_ID_TIMESTAMP || `${Math.floor(Date.now() / 10000)}`

// We're setting this to the environment because the global setup and the tests run in
// isolated workers/threads, meaning the local `cachedTestId` variable won't be available
process.env.SANITY_CLI_TEST_ID_TIMESTAMP = testIdTimestamp

let cachedTestId: string | undefined = process.env.SANITY_CLI_TEST_ID

/**
 * The generated ID contains enough information to:
 *   - Identify the test run the entity belongs to (duh)
 *   - Automatically clean up dangling entities from previous test runs (timestamp)
 *   - Separate runs in different OSes/node versions from eachother (platform/node major)
 *   - Separate runs in different _executions_ from eachother (process ID/github run ID)
 *
 * We use this test ID as the prefix for entities we create through the tests, and the tests
 * also prefix the studio version in their entities so we can concurrently run tests against
 * multiple studio versions without conflicts.
 *
 * Examples:
 *   - Local : test-168262061-dar-v16-wode-11664
 *   - GitHub: test-168262061-lin-v14-gh-1234
 */
const getTestId = () => {
  if (cachedTestId) {
    return cachedTestId
  }

  const localId = readFileSync(testIdPath, 'utf8').trim().slice(0, 5)
  const ghRunId = `${process.env.GITHUB_RUN_ID || ''}`.slice(-4)
  const ghId = `${ghRunId}-${process.env.GITHUB_RUN_NUMBER}-${process.env.GITHUB_RUN_ATTEMPT}`
  const githubId = process.env.GITHUB_RUN_ID ? `gh-${ghId}` : ''
  const runId = `${githubId || localId}`.replace(/\W/g, '-').replace(/(^-+|-+$)/g, '')

  const osPlatform = platform().slice(0, 3)
  cachedTestId = `test-${testIdTimestamp}-${osPlatform}-${nodeMajorVersion}-${runId}`

  // We're setting this to the environment because the global setup and the tests run in
  // isolated workers/threads, meaning the local `cachedTestId` variable won't be available
  process.env.SANITY_CLI_TEST_ID = cachedTestId

  return cachedTestId
}

/**
 * The dev server runs on a different port for each node version being tested. This is to avoid
 * port collisions when running tests in multiple versions of node simultaneously.
 *
 * The port is selected based on the assumption that the tests will be run once for node LTS and
 * once for node current.
 */
function getPort(version: string): number {
  if (process.release.lts) {
    return 4333
  }

  return 3333
}

export const testClient = createClient({
  apiVersion: '2022-09-09',
  projectId: cliProjectId,
  dataset: 'production',
  useCdn: false,
  token: cliUserToken,
  apiHost: cliApiHost,
})

export const getCliUserEmail = (): Promise<string> =>
  testClient.users.getById('me').then((user) => user.email)

export const getTestRunArgs = (version: string) => {
  const testId = getTestId()
  return {
    corsOrigin: `https://${testId}-${version}.sanity.build`,
    sourceDataset: 'production',
    dataset: `${testId}-${version}`,
    aclDataset: `${testId}-${version}-acl`,
    datasetCopy: `${testId}-copy-${version}`,
    documentsDataset: `${testId}-docs-${version}`,
    graphqlDataset: `${testId}-graphql-${version}`.replace(/-/g, '_'),
    alias: `${testId}-${version}-a`,
    graphqlTag: testId,
    exportTarball: 'production.tar.gz',
    importTarballPath: path.join(__dirname, '..', '__fixtures__', 'production.tar.gz'),
    port: getPort(version),
  }
}

export function runSanityCmdCommand(
  version: string,
  args: string[],
  options: {env?: Record<string, string | undefined>; cwd?: (cwd: string) => string} = {},
): Promise<{
  code: number | null
  stdout: string
  stderr: string
}> {
  const cwd = options.cwd ?? ((currentCwd) => currentCwd)

  return exec(process.argv[0], [cliBinPath, ...args], {
    cwd: cwd(path.join(studiosPath, version)),
    env: {...sanityEnv, ...options.env},
  })
}

export function exec(
  command: string,
  args: string[],
  options: Omit<SpawnOptions, 'stdio'>,
): Promise<{
  code: number | null
  stdout: string
  stderr: string
}> {
  return new Promise((resolve, reject) => {
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []

    const proc = spawn(command, args, {...options, stdio: 'pipe'})
    proc.stdout.on('data', (data) => stdout.push(data))
    proc.stderr.on('data', (data) => stderr.push(data))

    proc.on('close', (code) => {
      const stdoutStr = Buffer.concat(stdout).toString('utf8')
      const stderrStr = Buffer.concat(stderr).toString('utf8')

      if (code === 0) {
        resolve({code, stdout: stdoutStr, stderr: stderrStr})
      } else {
        reject(
          new ExecError(
            `Command failed:
Exit code: ${code}
Command: ${command} ${args.join(' ')}
CWD: ${options.cwd}\n
--- stderr ---
${stderrStr}\n
--------------\n
${
  stdoutStr &&
  `--- stdout ---\n
${stdoutStr}\n
--------------\n`
}`,
            code || 1,
            stdoutStr,
            stderrStr,
          ),
        )
      }
    })
  })
}

class ExecError extends Error {
  code: number
  stdout: string
  stderr: string
  constructor(message: string, code: number, stdout: string, stderr: string) {
    super(message)
    this.name = 'ExecError'
    this.code = code
    this.stdout = stdout
    this.stderr = stderr
  }
}
