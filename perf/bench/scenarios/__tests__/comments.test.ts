import {describe, expect, it} from 'vitest'

import {DEFAULT_INP_CONFIG} from '../../runner/session/inp'
import {UNEXPECTED_ENDPOINT_HINT, unexpectedEndpointHint} from '../../runner/session/interaction'
import {runStep} from '../../runner/session/steps'
import {addCommentSteps} from '../features/comments'
import {type StepContext} from '../types'

/** Minimal stand-in for the Playwright page surface the comment steps touch. */
function createFakePage() {
  const locator = {
    first: () => locator,
    locator: () => locator,
    getByLabel: () => locator,
    click: async () => {},
    hover: async () => {},
    waitFor: async () => {},
  }
  return {
    locator: () => locator,
    getByLabel: () => locator,
    keyboard: {type: async () => {}, press: async () => {}},
    evaluate: async () => false,
    waitForFunction: async () => {},
    waitForTimeout: async () => {},
  }
}

async function driveOnePass(): Promise<number> {
  const context: StepContext = {
    page: createFakePage() as unknown as StepContext['page'],
    running: {} as StepContext['running'],
    timeoutMs: 1000,
    interruptions: {count: 0, totalMs: 0},
  }
  const results = []
  for (const step of addCommentSteps('stringField')) {
    results.push(await runStep(context, step))
  }
  return results.reduce((total, result) => total + result.interactions, 0)
}

describe('addCommentSteps', () => {
  it('drives INP mode past its target in a single pass', async () => {
    // Posting a comment swaps the field button from the compose popover to a
    // count button, so pass two would find no "Add comment" affordance. The
    // session must therefore hit its target before the second pass starts.
    expect(await driveOnePass()).toBeGreaterThanOrEqual(DEFAULT_INP_CONFIG.targetInteractions)
  })

  it('reads back the posted comment from the mock store', () => {
    const send = addCommentSteps('stringField').at(-1)
    if (!send || !('readback' in send) || !send.readback) throw new Error('expected a readback')
    const store = (documents: {_type: string}[]) =>
      ({getAll: () => documents}) as unknown as Parameters<typeof send.readback>[0]

    expect(send.readback(store([]))).toBe(false)
    expect(send.readback(store([{_type: 'commentsField'}]))).toBe(false)
    expect(send.readback(store([{_type: 'comment'}]))).toBe(true)
    // The Comments API writes `sanity.comment`; the readback already accepts it, so that
    // migration needs no edit here.
    expect(send.readback(store([{_type: 'sanity.comment'}]))).toBe(true)
  })
})

describe('unexpectedEndpointHint', () => {
  it('names the Comments API migration instead of reporting generic drift', () => {
    const hint = unexpectedEndpointHint(['/vX/collaboration/comments/query'])
    expect(hint).not.toBe(UNEXPECTED_ENDPOINT_HINT)
    expect(hint.join(' ')).toMatch(/comments-v2/)
    expect(hint.join(' ')).toMatch(/Do NOT take the allowlist branch/)
  })

  it('falls back to the generic hint for any other endpoint', () => {
    expect(unexpectedEndpointHint(['/vX/data/unknown'])).toBe(UNEXPECTED_ENDPOINT_HINT)
  })
})
