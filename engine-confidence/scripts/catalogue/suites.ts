import path from 'node:path'

import {type CatalogueSuiteId} from '@repo/utils/engine-confidence'

import {type PinnedConfig} from '../config'

export interface SuiteRun {
  suite: CatalogueSuiteId
  label: string
  command: string
  baseArguments: string[]
  targets: string[]
  workingDirectory: string
  environment: Record<string, string>
}

const MUTATOR_PREFIX = 'packages/@sanity/mutator/'

function fuzzRun(
  config: PinnedConfig,
  repositoryRoot: string,
  seed: number,
  targets: string[],
  label: string,
): SuiteRun {
  return {
    suite: 'fuzz:pt',
    label,
    command: 'pnpm',
    baseArguments: ['exec', 'vitest', 'run', '-c', 'vitest.fuzz.config.mts'],
    targets,
    workingDirectory: path.join(repositoryRoot, 'packages/sanity'),
    environment: {
      FUZZ_SEED: String(seed),
      FUZZ_RUNS: String(config.catalogue.suites['fuzz:pt'].runs),
      NODE_OPTIONS: '--max-old-space-size=8192',
    },
  }
}

export function buildSuiteRuns(
  config: PinnedConfig,
  suite: CatalogueSuiteId,
  repositoryRoot: string,
): SuiteRun[] {
  if (suite === 'e2e') return []
  if (suite === 'fuzz:pt') {
    const {file, seeds} = config.catalogue.suites['fuzz:pt']
    return seeds.map((seed) => fuzzRun(config, repositoryRoot, seed, [file], `fuzz:pt:seed${seed}`))
  }
  const {project, paths} = config.catalogue.suites[suite]
  return [
    {
      suite,
      label: suite,
      command: 'pnpm',
      baseArguments: ['vitest', 'run', `--project=${project}`],
      targets: paths,
      workingDirectory: repositoryRoot,
      environment: {},
    },
  ]
}

/** How to run one witness test file: fuzz-named files use the fuzz config, the rest a project. */
export function witnessRunFor(
  config: PinnedConfig,
  repositoryRoot: string,
  witnessFile: string,
): SuiteRun {
  const absoluteFile = path.join(repositoryRoot, witnessFile)
  if (witnessFile.includes('.fuzz.test.')) {
    const [seed] = config.catalogue.suites['fuzz:pt'].seeds
    return fuzzRun(config, repositoryRoot, seed, [absoluteFile], `witness:${witnessFile}`)
  }
  const project = witnessFile.startsWith(MUTATOR_PREFIX)
    ? config.catalogue.suites['unit:mutator'].project
    : config.catalogue.suites['unit:engine'].project
  return {
    suite: witnessFile.startsWith(MUTATOR_PREFIX) ? 'unit:mutator' : 'unit:engine',
    label: `witness:${witnessFile}`,
    command: 'pnpm',
    baseArguments: ['vitest', 'run', `--project=${project}`],
    targets: [absoluteFile],
    workingDirectory: repositoryRoot,
    environment: {},
  }
}
