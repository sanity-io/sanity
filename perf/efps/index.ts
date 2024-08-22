/* eslint-disable no-console */
// eslint-disable-next-line import/no-unassigned-import
import 'dotenv/config'

import fs from 'node:fs'
import {createServer} from 'node:http'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import react from '@vitejs/plugin-react'
import chalk from 'chalk'
import Ora from 'ora'
import {chromium} from 'playwright'
// eslint-disable-next-line import/no-extraneous-dependencies
import prettier from 'prettier'
import sourcemaps from 'rollup-plugin-sourcemaps'
import handler from 'serve-handler'
import * as vite from 'vite'

import {exec} from './helpers/exec'
import {getCurrentGitBranchSync, getCurrentGitCommitSync} from './helpers/git'
//import {remapCpuProfile} from './helpers/remapCpuProfile'
import {metricsClient} from './metricsClient'
import {testClient as client} from './testClient'
import longProse from './tests/longProse/longProse'
import singlePte from './tests/singlePte/singlePte'
import singleString from './tests/singleString/singleString'
import {type EfpsTest, type EfpsTestRunnerContext} from './types'

const tests = [singlePte, singleString, longProse]
const headless = true

const {token, projectId} = client.config()

const workspaceDir = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(workspaceDir, '../..')
const timestamp = new Date()

const resultsDir = path.join(
  workspaceDir,
  'results',
  // e.g. run__2024-08-14__9:21:23am
  `run__${timestamp.getTime()}__${timestamp
    .toLocaleDateString('en-US')
    .replaceAll('/', '-')}__${timestamp
    .toLocaleTimeString('en-US')
    .replaceAll(' ', '')
    .replaceAll(':', '-')
    .toLowerCase()}`,
)

const spinner = Ora()

spinner.info(`Running ${tests.length} tests: ${tests.map((t) => `'${t.name}'`).join(', ')}`)

await exec({
  text: ['Building the monorepo…', 'Built monorepo'],
  command: 'pnpm run build',
  spinner,
  cwd: monorepoRoot,
})

await exec({
  text: ['Ensuring playwright is installed…', 'Playwright is installed'],
  command: 'npx playwright install',
  spinner,
})

let table = `benchmark | eFPS p50 | eFPS p75 | eFPS p90\n`
table += `--- | --: | --: | --:\n`

const formatFps = (fps: number) => {
  const rounded = fps.toFixed(1)
  if (fps >= 60) return chalk.green(rounded)
  if (fps < 20) return chalk.red(rounded)
  return chalk.yellow(rounded)
}

async function uploadFile(filePath: string, contentType: string, filename: string) {
  const readableStream = fs.createReadStream(filePath)
  const asset = await metricsClient.assets.upload('file', readableStream, {
    contentType,
    filename,
  })
  return asset
}

const branch = getCurrentGitBranchSync()
const commit = getCurrentGitCommitSync()

const doc = await metricsClient.create({
  _type: 'eFPSRun',
  branch,
  commit,
  timestamp: new Date(),
})

for (let i = 0; i < tests.length; i++) {
  const test = tests[i]
  const prefix = `Running '${test.name}' [${i + 1}/${tests.length}]…`
  const run = await runTest(prefix, test)
  const assets = []

  for (const file of run.files) {
    spinner.text = `${prefix}\n  └ Uploading file ${file}`
    const asset = await uploadFile(file, 'application/json', path.basename(file))
    assets.push(asset)
  }

  for (const result of run.results) {
    table += `${result.label} | ${formatFps(result.p50)} | ${formatFps(result.p75)} | ${formatFps(result.p90)}\n`

    const testResult = {
      _type: 'testResult',
      ...result,
      files: assets.map((asset) => ({_type: 'reference', _ref: asset._id})),
    }

    await metricsClient
      .patch(doc._id)
      .setIfMissing({tests: []})
      .append('tests', [testResult])
      .commit({autoGenerateArrayKeys: true})
  }
}

table += `\n\n`
table += `> eFPS — editor Frames Per Second\n`
table += `> \n`
table += `> The number of renders ("frames") that is assumed to be possible within a second.\n`
table += `> Derived from the median event input latency. Lower is better.\n`

const formattedTable = await prettier.format(table, {filepath: 'results.md'})
await fs.promises.writeFile(path.join(resultsDir, 'results.md'), formattedTable)

console.log(`\n${formattedTable}`)

async function runTest(loggerPrefix: string, test: EfpsTest) {
  const log = (text: string) => {
    spinner.text = `${loggerPrefix}\n  └ ${text}`
  }

  spinner.start(loggerPrefix)

  const outDir = path.join(workspaceDir, 'builds', test.name)
  const testResultsDir = path.join(resultsDir, test.name)

  await fs.promises.mkdir(outDir, {recursive: true})
  log('Building…')

  await vite.build({
    appType: 'spa',
    build: {outDir, sourcemap: true},
    plugins: [{...sourcemaps(), enforce: 'pre'}, react()],
    resolve: {
      alias: {'#config': fileURLToPath(test.configPath!)},
    },
    logLevel: 'silent',
  })

  log('Starting server…')
  const server = createServer((req, res) => {
    handler(req, res, {
      rewrites: [{source: '**', destination: '/index.html'}],
      public: outDir,
    })
  })

  await new Promise<void>((resolve) => server.listen(3300, resolve))

  let browser
  let document
  let context

  try {
    log('Launching browser…')
    browser = await chromium.launch({headless})
    context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:3300',
            localStorage: [
              {
                name: `__studio_auth_token_${projectId}`,
                value: JSON.stringify({token, time: new Date().toISOString()}),
              },
            ],
          },
        ],
      },
    })

    const page = await context.newPage()

    const runnerContext: EfpsTestRunnerContext = {browser, context, page, client}

    log('Creating test document…')
    const documentToCreate =
      typeof test.document === 'function' ? await test.document(runnerContext) : test.document
    document = await client.create(documentToCreate)

    const cdp = await context.newCDPSession(page)

    log('Loading editor…')
    await page.goto(
      `http://localhost:3300/intent/edit/id=${encodeURIComponent(document._id)};type=${encodeURIComponent(
        documentToCreate._type,
      )}`,
    )

    await cdp.send('Profiler.enable')
    await cdp.send('Profiler.start')

    log('Benchmarking…')
    const result = await test.run(runnerContext)

    log('Saving results…')
    let results = Array.isArray(result) ? result : [result]
    results = results.map((r) => ({...r, label: r.label ? `${test.name} (${r.label})` : test.name}))

    const {profile} = await cdp.send('Profiler.stop')
    //const remappedProfile = await remapCpuProfile(profile, outDir)

    await fs.promises.mkdir(testResultsDir, {recursive: true})

    const resultsPath = path.join(testResultsDir, 'results.json')
    await fs.promises.writeFile(resultsPath, JSON.stringify(results, null, 2))

    const rawProfilePath = path.join(testResultsDir, 'raw.cpuprofile')
    await fs.promises.writeFile(rawProfilePath, JSON.stringify(profile))

    //const remappedProfilePath = path.join(testResultsDir, 'mapped.cpuprofile')
    //await fs.promises.writeFile(remappedProfilePath, JSON.stringify(remappedProfile))

    spinner.succeed(`Ran benchmark '${test.name}' ${formatFps(results[0].p50)} eFPS`)

    return {
      results,
      files: [rawProfilePath /*remappedProfilePath*/],
    }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    )

    await context?.close()
    await browser?.close()

    if (document) {
      await Promise.allSettled([
        client.delete(document._id),
        client.delete(`drafts.${document._id}`),
      ])
    }
  }
}
