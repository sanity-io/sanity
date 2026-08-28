import {arrayI18n} from './arrayI18n'
import {article} from './article'
import {
  customInputs,
  debugLoop,
  documentActions,
  listenQueryPane,
  previewHeavy,
  structurePane,
} from './customizations'
import {recipe} from './recipe'
import {singleString} from './singleString'
import {synthetic, syntheticLarge} from './synthetic'
import {type BenchScenario} from './types'
import {wrappedForm} from './wrappedForm'

export const SCENARIOS: BenchScenario[] = [
  singleString,
  arrayI18n,
  article,
  recipe,
  synthetic,
  syntheticLarge,
  // Customization scenarios — one workspace each, only in the customization
  // build (pnpm --filter bench build:customizations)
  previewHeavy,
  customInputs,
  debugLoop,
  documentActions,
  structurePane,
  listenQueryPane,
  wrappedForm,
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
