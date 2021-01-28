import os from 'os'
import getRepoInfo from 'git-repo-info'
import {uuid} from '@sanity/uuid'
import {omit} from 'lodash'
import {testTypingSpeed} from './type-speed'
import {sanity} from './sanity'

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

const baseVersion = require('../lerna.json').version

const instance = getInstanceInfo()
const repoInfo = getRepoInfo()
const workflowInfo = getWorkflowInfo()

testTypingSpeed().then((result) => {
  const docId = uuid()
  sanity.createIfNotExists({
    _id: docId,
    _type: 'typingPerfSample',
    baseVersion,
    git: {
      branch: repoInfo.branch,
      tag: repoInfo.tag,
      commit: {
        sha: repoInfo.sha,
        author: repoInfo.author,
        committer: repoInfo.committer,
        authoredAt: repoInfo.authorDate,
        committedAt: repoInfo.committerDate,
      },
    },
    result: result,
    ci: process.env.CI === 'true',
    instance,
  })
})
