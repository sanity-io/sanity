import {describe, expect, test} from 'vitest'

import {RUN_URL} from './__fixtures__/factories'
import {buildResultText, type ResultInput} from './result'
import {type Approval, type GuardReason} from './types'

const RUN_LINK = `<${RUN_URL}|Open github workflow>`
const HOSTILE_COMMENT = '<!channel> <https://evil.example|click here> & \u0000more\nlines'
const APPROVAL: Approval = {
  login: 'reviewer<!here>',
  comment: HOSTILE_COMMENT,
  state: 'approved',
  slots: [1],
}
const GUARD_REASONS: GuardReason[] = [
  'multiple-slots-approved',
  'slot-not-approved',
  'stable-moved',
  'not-eligible',
  'data-unavailable',
]

function makeInput(overrides: Partial<ResultInput> = {}): ResultInput {
  return {
    slot: 2,
    slotCount: 3,
    version: '6.22.0',
    previous: '6.15.0',
    outcome: 'promoted',
    approval: APPROVAL,
    runUrl: RUN_URL,
    ...overrides,
  }
}

function expectSafe(text: string) {
  expect(text).not.toContain('<!channel>')
  expect(text).not.toContain('<!here>')
  expect(text).not.toContain('<https://evil.example|click here>')
  expect(text).not.toContain('\u0000')
  expect(text.endsWith(RUN_LINK)).toBe(true)
}

describe('buildResultText', () => {
  test('promoted', () => {
    const text = buildResultText(makeInput())
    expectSafe(text)
    expect(text).toContain('*sanity 6.22.0 is now @stable* (was 6.15.0)')
    expect(text).toContain('Slot 2 of 3')
    expect(text).toContain('&lt;!channel&gt;')
  })

  test('promoted without a comment omits the quote', () => {
    const text = buildResultText(makeInput({approval: {...APPROVAL, comment: ''}}))
    expect(text).not.toContain('“')
  })

  test('tag-failed', () => {
    const text = buildResultText(makeInput({outcome: 'tag-failed'}))
    expectSafe(text)
    expect(text).toContain('failed while tagging')
    expect(text).toContain('gh workflow run tag-stable.yml -f version=6.22.0')
  })

  test.each(GUARD_REASONS)('guard-failed for %s', (guardReason) => {
    const text = buildResultText(makeInput({outcome: 'guard-failed', guardReason}))
    expectSafe(text)
    expect(text).toContain('Did not promote sanity 6.22.0 (slot 2 of 3)')
    expect(text).toContain('Nothing was tagged')
    expect(text).toContain('other slots in this run remain open')
    expect(text).not.toContain('a safety check failed')
  })

  test('guard-failed reason texts', () => {
    const reasons = GUARD_REASONS.map((guardReason) =>
      buildResultText(makeInput({outcome: 'guard-failed', guardReason})),
    )
    expect(reasons[0]).toContain('more than one slot was approved in this run')
    expect(reasons[1]).toContain("this slot's approval could not be confirmed")
    expect(reasons[2]).toContain('stable changed since the shortlist was made')
    expect(reasons[3]).toContain('the version is no longer eligible')
    expect(reasons[4]).toContain('could not re-check Radar or npm')
  })

  test('not-eligible includes escaped hard reasons', () => {
    const text = buildResultText(
      makeInput({
        outcome: 'guard-failed',
        guardReason: 'not-eligible',
        hardReasons: ['<!channel> regression'],
      }),
    )
    expect(text).toContain('(&lt;!channel&gt; regression)')
  })

  test('the approver login is escaped', () => {
    expect(buildResultText(makeInput())).toContain('@reviewer&lt;!here&gt;')
  })
})
