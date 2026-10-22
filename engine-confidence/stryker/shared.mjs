import {readFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const stryckerDirectory = import.meta.dirname
const packageRoot = path.dirname(stryckerDirectory)
const reportsDirectory = path.join(packageRoot, 'reports', 'stryker')

const tier1 = JSON.parse(readFileSync(path.join(packageRoot, 'tier1.json'), 'utf8'))
const pinnedConfig = JSON.parse(readFileSync(path.join(packageRoot, 'config.json'), 'utf8'))

export function createStrykerConfig(target) {
  return {
    testRunner: 'vitest',
    plugins: [
      fileURLToPath(import.meta.resolve('@stryker-mutator/vitest-runner')),
      path.join(stryckerDirectory, 'messageIgnorer.ts'),
    ],
    ignorers: ['engine-confidence-messages'],
    coverageAnalysis: 'perTest',
    inPlace: true,
    ignoreStatic: false,
    timeoutMS: pinnedConfig.stryker.timeoutMs,
    dryRunTimeoutMinutes: 10,
    concurrency: pinnedConfig.stryker.concurrency,
    mutate: tier1[target].mutate,
    mutator: {excludedMutations: []},
    reporters: ['json', 'clear-text'],
    jsonReporter: {fileName: path.join(reportsDirectory, `${target}.json`)},
    vitest: {
      configFile: path.join(stryckerDirectory, `vitest.${target}.config.mts`),
      related: false,
    },
    incremental: true,
    incrementalFile: path.join(reportsDirectory, `${target}.incremental.json`),
    cleanTempDir: 'always',
  }
}
