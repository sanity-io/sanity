// oxlint-disable no-console
import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {optional, withDefault} from '@optique/core/modifiers'
import {command, constant, option} from '@optique/core/primitives'
import {choice} from '@optique/core/valueparser'

import {SCENARIOS} from '../../scenarios'
import {type BenchScenario} from '../../scenarios/types'

export const scenariosCommand = command(
  'scenarios',
  object({
    action: constant('scenarios'),
    json: option('--json', {
      description: message`Print a machine-readable name array (for CI matrices)`,
    }),
    mode: optional(
      option('--mode', choice(['inp', 'pageload']), {
        description: message`Filter to scenarios declaring participation in this bench mode`,
      }),
    ),
    schedule: withDefault(
      option('--schedule', choice(['perPr', 'daily']), {
        description: message`With --mode inp, which schedule's scenario list to select`,
      }),
      'perPr' as const,
    ),
  }),
  {description: message`List the available benchmark scenarios`},
)

export function participatesInMode(
  scenario: BenchScenario,
  mode: 'inp' | 'pageload' | undefined,
  schedule: 'perPr' | 'daily',
): boolean {
  if (mode === undefined) return true
  if (mode === 'pageload') return Boolean(scenario.modes?.pageload)
  return Boolean(scenario.modes?.inp?.[schedule])
}

export function listScenarios(
  json: boolean,
  mode?: 'inp' | 'pageload',
  schedule: 'perPr' | 'daily' = 'perPr',
): void {
  const selected = SCENARIOS.filter((scenario) => participatesInMode(scenario, mode, schedule))
  if (json) {
    console.log(JSON.stringify(selected.map((scenario) => scenario.name)))
    return
  }
  const width = Math.max(...selected.map((scenario) => scenario.name.length))
  for (const scenario of selected) {
    const fields = scenario.interactions
      .map((target) => target.label ?? target.fieldPath)
      .join(', ')
    console.log(
      `${scenario.name.padEnd(width)}  ${scenario.documentType} document — types into: ${fields}`,
    )
  }
}
