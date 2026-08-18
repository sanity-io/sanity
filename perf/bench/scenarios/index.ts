import {arrayI18n} from './arrayI18n'
import {article} from './article'
import {recipe} from './recipe'
import {singleString} from './singleString'
import {synthetic, syntheticLarge} from './synthetic'
import {type BenchScenario} from './types'

export const SCENARIOS: BenchScenario[] = [
  singleString,
  arrayI18n,
  article,
  recipe,
  synthetic,
  syntheticLarge,
]

export function getScenario(name: string): BenchScenario {
  const scenario = SCENARIOS.find((candidate) => candidate.name === name)
  if (!scenario) {
    throw new Error(
      `Unknown scenario "${name}". Available: ${SCENARIOS.map((s) => s.name).join(', ')}`,
    )
  }
  return scenario
}
