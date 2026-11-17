import {cpSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {computePinnedHash, pinnedHashMatches, readPinnedConfig} from './config'
import {engineConfidenceDirectory} from './paths'
import {pinConfig} from './pin'

function copyOfPinnedFiles(): string {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'engine-confidence-config-'))
  const pinnedEntries = ['config.json', 'tier1.json', 'exclusions.json', 'package.json', 'stryker']
  pinnedEntries.forEach((entry) => {
    cpSync(path.join(engineConfidenceDirectory, entry), path.join(directory, entry), {
      recursive: true,
    })
  })
  return directory
}

describe('pinned config', () => {
  test('matches the committed hash, so a config change without `pin` fails here', () => {
    expect(pinnedHashMatches()).toBe(true)
  })

  test('is a sha256 hex digest', () => {
    expect(computePinnedHash()).toMatch(/^[0-9a-f]{64}$/)
  })

  test('changes when the mutated file list changes', () => {
    const directory = copyOfPinnedFiles()
    const before = computePinnedHash(directory)
    const tier1Path = path.join(directory, 'tier1.json')
    writeFileSync(
      tier1Path,
      readFileSync(tier1Path, 'utf8').replace(
        '"!src/document/debug.ts"',
        '"!src/document/other.ts"',
      ),
    )

    expect(computePinnedHash(directory)).not.toBe(before)
  })

  test('changes when the exclusion register changes', () => {
    const directory = copyOfPinnedFiles()
    const before = computePinnedHash(directory)
    const exclusionsPath = path.join(directory, 'exclusions.json')
    writeFileSync(exclusionsPath, readFileSync(exclusionsPath, 'utf8').replace('"reason"', '"why"'))

    expect(computePinnedHash(directory)).not.toBe(before)
  })

  test('changes when a Stryker config file changes', () => {
    const directory = copyOfPinnedFiles()
    const before = computePinnedHash(directory)
    const sharedPath = path.join(directory, 'stryker', 'shared.mjs')
    writeFileSync(sharedPath, `${readFileSync(sharedPath, 'utf8')}\n// changed`)

    expect(computePinnedHash(directory)).not.toBe(before)
  })

  test('ignores the stored hash itself', () => {
    const directory = copyOfPinnedFiles()
    const before = computePinnedHash(directory)
    const configPath = path.join(directory, 'config.json')
    writeFileSync(
      configPath,
      readFileSync(configPath, 'utf8').replace(/"pinnedHash": "[0-9a-f]*"/, '"pinnedHash": "x"'),
    )

    expect(computePinnedHash(directory)).toBe(before)
  })
})

describe('pinConfig', () => {
  test('leaves a current config untouched', () => {
    const directory = copyOfPinnedFiles()

    expect(pinConfig(directory)).toMatchObject({
      changed: false,
      version: readPinnedConfig().version,
    })
  })

  test('bumps the version and rewrites the hash after a pinned file changes', () => {
    const directory = copyOfPinnedFiles()
    const before = readPinnedConfig(directory)
    const sharedPath = path.join(directory, 'stryker', 'shared.mjs')
    writeFileSync(sharedPath, `${readFileSync(sharedPath, 'utf8')}\n// changed`)

    const outcome = pinConfig(directory)

    expect(outcome.changed).toBe(true)
    expect(outcome.version).toBe(before.version + 1)
    expect(readPinnedConfig(directory)).toMatchObject({
      version: before.version + 1,
      pinnedHash: outcome.hash,
    })
    expect(pinConfig(directory).changed).toBe(false)
  })
})
