import {describe, expect, it} from 'vitest'

import {type BenchScenario} from '../../scenarios/types'
import {DEFAULT_READY_SELECTOR, readySelector, scenarioUrl} from '../session/navigation'

const STUDIO_URL = 'https://localhost:3411'

function scenario(overrides: Partial<BenchScenario> = {}): BenchScenario {
  return {
    name: 'singleString',
    sourceFile: 'perf/bench/scenarios/singleString.ts',
    documentType: 'singleString',
    documentId: 'bench-single-string',
    fixture: () => [],
    interactions: [],
    ...overrides,
  }
}

describe('scenarioUrl', () => {
  it('builds the edit-intent URL with encoded id and type', () => {
    expect(scenarioUrl(STUDIO_URL, scenario({documentId: 'a;b/c', documentType: 'my type'}))).toBe(
      `${STUDIO_URL}/singleString/intent/edit/id=a%3Bb%2Fc;type=my%20type`,
    )
  })

  it('uses the workspace field over the scenario name when set', () => {
    expect(scenarioUrl(STUDIO_URL, scenario({workspace: 'shared'}))).toBe(
      `${STUDIO_URL}/shared/intent/edit/id=bench-single-string;type=singleString`,
    )
  })

  it('opens the workspace-relative path instead of the intent when set', () => {
    expect(scenarioUrl(STUDIO_URL, scenario({path: 'structure/bench-pane'}))).toBe(
      `${STUDIO_URL}/singleString/structure/bench-pane`,
    )
  })
})

describe('readySelector', () => {
  it('defaults to the editable document form', () => {
    expect(readySelector(scenario())).toBe(DEFAULT_READY_SELECTOR)
    expect(DEFAULT_READY_SELECTOR).toBe('[data-testid="form-view"]:not([data-read-only="true"])')
  })

  it('honors a scenario override', () => {
    expect(readySelector(scenario({readySelector: '[data-testid="bench-custom-pane"]'}))).toBe(
      '[data-testid="bench-custom-pane"]',
    )
  })
})
