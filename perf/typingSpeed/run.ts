import os from 'os'
import crypto from 'crypto'
import getRepoInfo from 'git-repo-info'
import Hashids from 'hashids'
import {omit} from 'lodash'
import {nanoid} from 'nanoid'
import {uuid} from '@sanity/uuid'
import {createClient} from '@sanity/client'
import {testTypingSpeed} from './typingSpeed'

const hashIds = new Hashids()

function getEnv(varName: string): string {
  if (!(varName in process.env)) {
    throw new Error(`Missing environment variable "${varName}"`)
  }
  return process.env[varName]!
}

const writeToken = getEnv('PERF_STUDIO_SANITY_WRITE_TOKEN')
const userToken = getEnv('PERF_TEST_SANITY_SESSION_TOKEN')

export const sanity = createClient({
  token: writeToken,
  projectId: 'ppsg7ml5',
  dataset: 'perf',
  useCdn: false,
})

function getInstanceInfo(hardwareProfileId: string) {
  const [avg1m, avg5m, avg10m] = os.loadavg()
  return {
    type: os.type(),
    hardwareProfile: {
      _type: 'reference',
      _ref: hardwareProfileId,
    },
    platform: os.platform(),
    version: os.version(),
    hostname: os.hostname(),
    arch: os.arch(),
    memory: {total: os.totalmem(), free: os.freemem()},
    uptime: os.uptime(),
    loadavg: {avg1m, avg5m, avg10m},
  }
}

function getWorkflowInfo() {
  const workflowName = process.env.GITHUB_WORKFLOW
  if (!workflowName) {
    return undefined
  }
  return {
    workflow: workflowName,
    action: process.env.GITHUB_ACTION,
    runId: process.env.GITHUB_RUN_ID,
  }
}

if (!writeToken || !userToken) {
  throw new Error('Missing required environment variables')
}

const baseVersion = require('../../lerna.json').version

function getHardwareProfile() {
  const cpus = os.cpus().map((cpu, i) => {
    return {...omit(cpu, 'times'), _key: `cpu_${i}`}
  })

  const signature = cpus.map((cpu) => cpu.model + cpu.speed).join('')
  const id = hash(signature)
  return {
    _id: id,
    _type: 'hardwareProfile',
    memory: os.totalmem(),
    cpus: cpus,
  }
}

function hash(str: string) {
  return hashIds.encodeHex(crypto.createHash('sha1').update(str).digest('hex'))
}

const hardwareProfile = getHardwareProfile()

const instance = getInstanceInfo(hardwareProfile._id)
const repoInfo = getRepoInfo()
const workflowInfo = getWorkflowInfo()

export async function runTypingSpeedTest() {
  const result = await testTypingSpeed({userToken})

  const perfRunDoc = {
    _type: 'typingPerfRun',
    _id: uuid(),
    baseVersion,
    git: {
      branch: repoInfo.branch || undefined,
      tag: repoInfo.tag || undefined,
      sha: repoInfo.sha || undefined,
    },
    github: workflowInfo,
    result: result,
    ci: process.env.CI === 'true',
    instance,
  }

  const summaryDoc = {
    _id: `${hardwareProfile._id}-typingSpeed`,
    _type: 'typingSpeedSummary',
    hardwareProfile: {
      _type: 'reference',
      _ref: hardwareProfile._id,
    },
  }

  return sanity
    .transaction()
    .createIfNotExists(hardwareProfile)
    .createIfNotExists(summaryDoc)
    .patch(summaryDoc._id, (p) =>
      p
        .setIfMissing({runs: []})
        .insert('before', 'runs[0]', [
          {
            _key: `run-${nanoid(16)}`,
            _type: 'reference',
            _ref: perfRunDoc._id,
          },
        ])
        .unset(['runs[200:]'])
    )
    .create(perfRunDoc)
    .commit()
}
