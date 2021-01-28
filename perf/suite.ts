import os from 'os'
import getRepoInfo from 'git-repo-info'
import {uuid} from '@sanity/uuid'
import {omit} from 'lodash'
import createClient from '@sanity/client'
import {testTypingSpeed} from './typingSpeed'

const writeToken = process.env.SANITY_PERF_STUDIO_WRITE_TOKEN
const userToken = process.env.SANITY_PERF_STUDIO_USER_TOKEN

export const sanity = createClient({
  token: writeToken,
  projectId: 'ppsg7ml5',
  dataset: 'perf',
  useCdn: false,
})

function getInstanceInfo() {
  return {
    type: os.type(),
    platform: os.platform(),
    version: os.version(),
    hostname: os.hostname(),
    arch: os.arch(),
    cpus: os.cpus().map((cpu, i) => {
      return {...omit(cpu, 'times'), _key: `cpu_${i}`}
    }),
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

const baseVersion = require('../lerna.json').version

const instance = getInstanceInfo()
const repoInfo = getRepoInfo()
const workflowInfo = getWorkflowInfo()

testTypingSpeed({userToken: userToken}).then(
  (result) => {
    const docId = uuid()
    return sanity.create({
      _id: docId,
      _type: 'typingPerfRun',
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
    })
  },
  (err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  }
)
