import {describe, expect, test} from 'vitest'

import {abDispatchCommand, compareUrl, dispatchRunsUrl} from './links'

const FROM_SHA = 'a'.repeat(40)
const TO_SHA = 'b'.repeat(40)

describe('abDispatchCommand', () => {
  test('dispatches bench.yml with the reference as ab_from and the experiment as ab_to', () => {
    expect(abDispatchCommand(FROM_SHA, TO_SHA)).toBe(
      `gh workflow run bench.yml -R sanity-io/sanity -f ab_from=${FROM_SHA} -f ab_to=${TO_SHA}`,
    )
  })

  test('the dispatched-runs page filters on workflow_dispatch events', () => {
    expect(dispatchRunsUrl()).toBe(
      'https://github.com/sanity-io/sanity/actions/workflows/bench.yml?query=event%3Aworkflow_dispatch',
    )
  })
})

describe('compareUrl', () => {
  test('uses the three-dot range form (commits reachable from to but not from)', () => {
    expect(compareUrl(FROM_SHA, TO_SHA)).toBe(
      `https://github.com/sanity-io/sanity/compare/${FROM_SHA}...${TO_SHA}`,
    )
  })
})
