/* eslint-disable no-process-exit */
import path from 'path'
import {hostname} from 'os'
import {execFileSync, spawnSync} from 'child_process'
import {mkdir, stat, readFile, rename, writeFile, copyFile} from 'fs/promises'
import {copy as copyCb} from 'cpx'
import Configstore from 'configstore'
import {createClient} from '@sanity/client'

import {
  baseTestPath,
  cliBinPath,
  cliConfigPath,
  cliInstallPath,
  cliProjectId,
  cliUserToken,
  exec,
  getTestRunArgs,
  hasBuiltCli,
  nodePath,
  npmPath,
  packPath,
  fixturesPath,
  studiosPath,
  studioVersions,
  testIdPath,
} from './environment'

const SYMLINK_SCRIPT = path.resolve(__dirname, '../../../../../scripts/symlinkDependencies.js')

export default async function globalSetup(): Promise<void> {
  // Write a file with the test id, so it can be shared across workers
  const localHost = hostname().toLowerCase().split('.')[0]
  const testId = `${localHost}-${process.ppid || process.pid}`

  await mkdir(baseTestPath, {recursive: true})
  await writeFile(testIdPath, testId, 'utf8')

  if (!cliUserToken) {
    console.warn('\nNo SANITY_CI_CLI_AUTH_TOKEN set, skipping CLI tests')
    return
  }

  // Check that we've got a built CLI first
  if (!hasBuiltCli) {
    console.warn('Must have built the CLI with `npm run build` before running integration tests')
    return
  }

  // Do these things in parallel to save time
  await Promise.all([
    packCli().then((packedFilePath) => installAndVerifyPackedCli({packedFilePath})),
    prepareCliInstall(),
    prepareStaticFixtures(),
    prepareStudios(),
    prepareCliAuth(cliConfigPath),
    prepareDatasets(),
  ])
}

async function prepareStaticFixtures() {
  const dirs = ['static', 'static-basepath', 'static-root-basepath']
  const jobs = dirs.map((dir) => ({
    sourcePath: path.join(fixturesPath, dir),
    destinationPath: path.join(baseTestPath, dir),
  }))

  for (const {sourcePath, destinationPath} of jobs) {
    await mkdir(destinationPath, {recursive: true})
    await copy(`${sourcePath}/**`, destinationPath, {dereference: true})
  }
}

function prepareStudios() {
  // Copy the studios and install dependencies
  return Promise.all(
    studioVersions.map(async (version) => {
      const sourceStudioPath = path.join(fixturesPath, version)
      const destinationPath = path.join(studiosPath, version)
      const customDocStudioPath = path.join(studiosPath, `${version}-custom-document`)

      await copy(`${sourceStudioPath}/**/{*,.*}`, destinationPath, {dereference: true})

      if (version === 'v2') {
        await exec(npmPath, ['install', '--no-package-lock', '--legacy-peer-deps'], {
          cwd: destinationPath,
        })
      }
      if (version === 'v3') {
        // We'll want to test the actual integration with the monorepo packages,
        // instead of the versions that is available on npm, so we'll symlink them before running npm install
        await exec(nodePath, [SYMLINK_SCRIPT, destinationPath], {cwd: destinationPath})
        await exec(npmPath, ['install', '--no-package-lock'], {cwd: destinationPath})

        // Make a copy of the studio and include a custom document component, in order to see
        // that it resolves. We "cannot" use the same studio as it would _always_ use the
        // custom document component, thus not testing the path of the _default_ component
        await copy(`${sourceStudioPath}/**/{*,.*}`, customDocStudioPath, {dereference: true})
        await copyFile(
          `${customDocStudioPath}/components/EnvDocument.tsx`,
          `${customDocStudioPath}/_document.tsx`,
        )
        // We'll want to test the actual integration with the monorepo packages,
        // instead of the versions that is available on npm, so we'll symlink them before running npm install
        await exec(nodePath, [SYMLINK_SCRIPT, customDocStudioPath], {cwd: customDocStudioPath})
        await exec(npmPath, ['install', '--no-package-lock'], {cwd: customDocStudioPath})
      }
    }),
  )
}

async function prepareCliAuth(configPath: string) {
  if (!cliUserToken) {
    throw new Error('SANITY_CI_CLI_AUTH_TOKEN not set')
  }

  const client = createClient({
    projectId: cliProjectId,
    apiVersion: '1',
    useCdn: false,
    token: cliUserToken,
  })
  const user = await client.users.getById('me')
  if (!user || !user.id) {
    throw new Error('CLI auth token did not return a valid user')
  }

  // Store the config file in a different directory than the default, in order
  // to be easier to test locally without having the local user conflict
  const cs = new Configstore('sanity', {}, {globalConfigPath: true, configPath})
  cs.set('authToken', cliUserToken)
}

async function prepareDatasets() {
  const client = createClient({
    projectId: cliProjectId,
    apiVersion: '2022-06-03',
    useCdn: false,
    token: cliUserToken,
  })

  for (const version of studioVersions) {
    const args = getTestRunArgs(version)
    const datasets = [args.documentsDataset, args.graphqlDataset, args.aclDataset]

    await Promise.all(
      datasets.map((ds) => {
        // eslint-disable-next-line no-console
        console.log(`Creating dataset ${ds}...`)
        return client.datasets.create(ds, {aclMode: 'public'}).catch((err) => {
          err.message = `Failed to create dataset "${ds}":\n${err.message}`
          throw err
        })
      }),
    )
  }
}

async function installAndVerifyPackedCli({
  packedFilePath,
}: {
  packedFilePath: string
}): Promise<string> {
  // Install the packed tarball into the folder
  const [cliManifest] = await Promise.all([
    await readFile(path.join(__dirname, '..', '..', 'package.json'), 'utf8'),
    await exec(npmPath, ['install', packedFilePath], {cwd: cliInstallPath}),
  ])

  // Ensure the referenced binary exists
  const version = execFileSync(cliBinPath, ['--version'], {encoding: 'utf8'}).trim()

  // Ensure the version matches the one we just installed, eg is the correct build
  const correctVersion = JSON.parse(cliManifest).version

  if (!version.includes(correctVersion)) {
    throw new Error(`CLI version should include ${correctVersion} - got ${version}`)
  }

  return cliBinPath
}

async function prepareCliInstall(): Promise<void> {
  // Prepare a folder for the CLI to be installed into
  await mkdir(cliInstallPath, {recursive: true})
  spawnSync(npmPath, ['init', '-y'], {cwd: cliInstallPath})
}

async function packCli(): Promise<string> {
  // Run `npm pack` so we can create a fully isolated install, replicating what a user would get
  await mkdir(packPath, {recursive: true})
  const cwd = path.join(__dirname, '..', '..')
  const pack = await exec(npmPath, ['pack', '--json'], {cwd})
  if (pack.code !== 0) {
    throw new Error(pack.stderr)
  }

  // `--json` returns an array - we only need the first entry to tell us where the tarball is
  const [packResult] = JSON.parse(pack.stdout) || []
  if (!packResult || !packResult.id) {
    throw new Error('Unexpected `npm pack` result')
  }

  // Ironically, the filename returned isn't actually correct for scoped modules 🙄
  const packedFileName = packResult.filename.replace(/^@/, '').replace(/\//, '-')
  const packedFilePath = path.join(cwd, packedFileName)
  const destinationPath = path.join(packPath, packedFileName)
  await stat(packedFilePath)

  // Move it to the pack folder (`--pack-destination` is not available on older node/npm versions)
  await rename(packedFilePath, destinationPath)

  return destinationPath
}

function copy(src: string, dest: string, options: {dereference?: boolean}): Promise<void> {
  return new Promise((resolve, reject) =>
    copyCb(src, dest, options, (err) => (err ? reject(err) : resolve())),
  )
}
