// oxlint-disable no-console
import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {command, constant, option} from '@optique/core/primitives'

import {SCENARIOS} from '../../scenarios'

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
    const fields = scenario.interactions
      .map((target) => target.label ?? target.fieldPath)
      .join(', ')
    console.log(
      `${scenario.name.padEnd(width)}  ${scenario.documentType} document — types into: ${fields}`,
    )
  }
}
