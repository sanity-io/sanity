import {deburr} from 'lodash'
import getRepoInfo from 'git-repo-info'
import {uuid} from '@sanity/uuid'
import {getHardwareProfile, getInstanceInfo, getWorkflowInfo} from './environmentMetadata'

const baseVersion = require('../../../lerna.json').version

export function createReportDocs(testName: string, samples: number[]) {
  const hardwareProfile = getHardwareProfile()

  const instance = getInstanceInfo(hardwareProfile._id)
  const repoInfo = getRepoInfo()
  const workflowInfo = getWorkflowInfo()

  const summary = {
    _id: `perf-test-${hardwareProfile._id}-${deburr(testName.replace(/a-zA-Z0-9._-/, '_'))}\``,
    _type: 'testResult',
    hardwareProfile: {
      _type: 'reference',
      _ref: hardwareProfile._id,
    },
  } as const

  const perfRun = {
    _type: 'perfRun',
    _id: uuid(),
    baseVersion,
    git: {
      branch: repoInfo.branch || undefined,
      tag: repoInfo.tag || undefined,
      sha: repoInfo.sha || undefined,
    },
    github: workflowInfo,
    samples,
    ci: process.env.CI === 'true',
    instance,
  } as const
  return {summary, perfRun, hardwareProfile}
}
