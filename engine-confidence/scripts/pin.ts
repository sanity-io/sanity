// oxlint-disable no-console
import {readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'

import {computePinnedHash, readPinnedConfig} from './config'
import {engineConfidenceDirectory} from './paths'

export function pinConfig(directory = engineConfidenceDirectory): {
  changed: boolean
  version: number
  hash: string
} {
  const config = readPinnedConfig(directory)
  const hash = computePinnedHash(directory)
  if (config.pinnedHash === hash) {
    return {changed: false, version: config.version, hash}
  }
  const configPath = path.join(directory, 'config.json')
  const rawConfig = readFileSync(configPath, 'utf8')
  const hasPreviousHash = config.pinnedHash.length > 0
  const version = hasPreviousHash ? config.version + 1 : config.version
  const rewritten = rawConfig
    .replace(/"version": \d+/, `"version": ${version}`)
    .replace(/"pinnedHash": "[0-9a-f]*"/, `"pinnedHash": "${hash}"`)
  writeFileSync(configPath, rewritten)
  return {changed: true, version, hash}
}

if (import.meta.main) {
  const outcome = pinConfig()
  console.log(
    outcome.changed
      ? `Pinned config version ${outcome.version}, hash ${outcome.hash}`
      : `Pinned config already current (version ${outcome.version}, hash ${outcome.hash})`,
  )
}
