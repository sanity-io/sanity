import os from 'os'
import crypto from 'crypto'
import {omit} from 'lodash'
import Hashids from 'hashids'

const hashIds = new Hashids()

export function getInstanceInfo(hardwareProfileId: string) {
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

export function getWorkflowInfo() {
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

export function getHardwareProfile() {
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
  } as const
}

function hash(str: string) {
  return hashIds.encodeHex(crypto.createHash('sha1').update(str).digest('hex'))
}
