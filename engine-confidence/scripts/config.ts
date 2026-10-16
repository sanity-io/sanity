import {createHash} from 'node:crypto'
import {readdirSync, readFileSync} from 'node:fs'
import path from 'node:path'

import {type CatalogueSuiteId, type StrykerTargetId} from '@repo/utils/engine-confidence'

import {engineConfidenceDirectory, repositoryRoot} from './paths'

export interface UnitSuiteConfig {
  project: string
  paths: string[]
}

export interface FuzzSuiteConfig {
  file: string
  seeds: number[]
  runs: number
}

export interface PinnedConfig {
  version: number
  pinnedHash: string
  stryker: {
    timeoutMs: number
    concurrency: number
    dryRunFloor: Record<StrykerTargetId, number>
  }
  catalogue: {
    suites: {
      'unit:mutator': UnitSuiteConfig
      'unit:engine': UnitSuiteConfig
      'fuzz:pt': FuzzSuiteConfig
    }
  }
}

export interface Tier1Target {
  packageDir: string
  mutate: string[]
}

export type Tier1Config = Record<StrykerTargetId, Tier1Target>

export const STRYKER_PATCH_PATH = 'patches/@stryker-mutator__vitest-runner@10.0.0.patch'

export function readJsonFile<Shape>(filePath: string): Shape {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Shape
}

export function readPinnedConfig(directory = engineConfidenceDirectory): PinnedConfig {
  return readJsonFile<PinnedConfig>(path.join(directory, 'config.json'))
}

export function readTier1Config(directory = engineConfidenceDirectory): Tier1Config {
  return readJsonFile<Tier1Config>(path.join(directory, 'tier1.json'))
}

export function suiteIdsOf(config: PinnedConfig): CatalogueSuiteId[] {
  return [...(Object.keys(config.catalogue.suites) as CatalogueSuiteId[]), 'e2e']
}

function strykerSpecifiersOf(directory: string): Record<string, string> {
  const manifest = readJsonFile<{devDependencies: Record<string, string>}>(
    path.join(directory, 'package.json'),
  )
  return Object.fromEntries(
    Object.entries(manifest.devDependencies).filter(([name]) =>
      name.startsWith('@stryker-mutator/'),
    ),
  )
}

/**
 * sha256 over everything that defines the measurement, in a fixed order. The catalogue and the
 * installed Vitest version are left out: growth and Renovate bumps must not break the series.
 */
export function computePinnedHash(
  directory = engineConfidenceDirectory,
  patchPath = path.join(repositoryRoot, STRYKER_PATCH_PATH),
): string {
  const config = readPinnedConfig(directory)
  const strykerDirectory = path.join(directory, 'stryker')
  const strykerFiles = readdirSync(strykerDirectory)
    .toSorted()
    .map((fileName) => [
      `stryker/${fileName}`,
      readFileSync(path.join(strykerDirectory, fileName), 'utf8'),
    ])
  const inputs: Array<[string, string]> = [
    ['config.json', JSON.stringify({...config, version: 0, pinnedHash: ''})],
    ['tier1.json', readFileSync(path.join(directory, 'tier1.json'), 'utf8')],
    ['exclusions.json', readFileSync(path.join(directory, 'exclusions.json'), 'utf8')],
    ...(strykerFiles as Array<[string, string]>),
    ['patch', readFileSync(patchPath, 'utf8')],
    ['stryker-specifiers', JSON.stringify(strykerSpecifiersOf(directory))],
  ]
  const hash = createHash('sha256')
  inputs.forEach(([label, content]) => {
    hash.update(`${label}\0${content}\0`)
  })
  return hash.digest('hex')
}

export function pinnedHashMatches(directory = engineConfidenceDirectory): boolean {
  return readPinnedConfig(directory).pinnedHash === computePinnedHash(directory)
}
