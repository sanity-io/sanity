// oxlint-disable no-console
import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {command, constant, option} from '@optique/core/primitives'

import {SCENARIOS} from '../../scenarios'
import {type BenchScenario} from '../../scenarios/types'

export const scenariosCommand = command(
  'scenarios',
  object({
    action: constant('scenarios'),
    json: option('--json', {
      description: message`Print a machine-readable name array (for CI matrices)`,
    }),
  }),
  {description: message`List the available benchmark scenarios`},
)

export function listScenarios(json: boolean): void {
  if (json) {
    console.log(JSON.stringify(SCENARIOS.map((scenario) => scenario.name)))
    return
  }
  const width = Math.max(...SCENARIOS.map((scenario) => scenario.name.length))
  for (const scenario of SCENARIOS) {
    console.log(
      `${scenario.name.padEnd(width)}  ${scenario.documentType ? `${scenario.documentType} document` : 'no document'} — ${describeScenario(scenario)}`,
    )
  }
}

function describeScenario(scenario: BenchScenario): string {
  const fields = scenario.interactions.map((target) => target.label ?? target.fieldPath).join(', ')
  if (fields) return `types into: ${fields}`
  if (scenario.load) return 'pageload only (load steps)'
  if (scenario.softNav) return `softnav only (${scenario.softNav.steps.length} steps)`
  return 'settle only (no typing targets)'
}
