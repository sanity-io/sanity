import {describe, expect, it} from 'vitest'

import {type ScenarioStep, type StepContext} from '../../../scenarios/types'
import {milestoneMeasureName, resolveLocator, runStep, toTypeStep} from '../steps'

interface FakeLocator {
  selector: string
  scope?: string
  labelOptions?: {exact?: boolean}
  first: () => FakeLocator
  locator: (inner: string) => FakeLocator
  getByLabel: (label: string, options?: {exact?: boolean}) => FakeLocator
  waitFor: () => Promise<void>
  hover: () => Promise<void>
  click: (options?: {trial?: boolean}) => Promise<void>
  evaluate: () => Promise<void>
}

interface FakePageLog {
  clicks: string[]
  hovers: string[]
  wheels: number[]
  presses: string[]
  typed: string[]
  waits: number
  /** Measure names recorded in-page (milestones). */
  measures: string[]
  /** Arguments passed to waitForFunction. */
  waitedFor: unknown[]
}

function makeLocator(
  log: FakePageLog,
  selector: string,
  scope?: string,
  labelOptions?: {exact?: boolean},
): FakeLocator {
  const locator: FakeLocator = {
    selector,
    scope,
    labelOptions,
    first: () => locator,
    locator: (inner) => makeLocator(log, inner, selector),
    getByLabel: (label, options) => makeLocator(log, label, selector, options),
    waitFor: async () => {},
    hover: async () => {
      log.hovers.push(selector)
    },
    click: async (options) => {
      log.clicks.push(options?.trial ? `trial:${selector}` : selector)
    },
    evaluate: async () => {},
  }
  return locator
}

function createFakePage(pageOptions: {readOnly?: boolean; probeLands?: boolean} = {}) {
  const {probeLands = true} = pageOptions
  let readOnly = pageOptions.readOnly ?? false
  const log: FakePageLog = {
    clicks: [],
    hovers: [],
    wheels: [],
    presses: [],
    typed: [],
    waits: 0,
    measures: [],
    waitedFor: [],
  }
  const page = {
    log,
    locator: (selector: string) => makeLocator(log, selector),
    getByLabel: (label: string, options?: {exact?: boolean}) =>
      makeLocator(log, label, undefined, options),
    keyboard: {
      type: async (text: string) => {
        log.typed.push(text)
      },
      press: async (key: string) => {
        log.presses.push(key)
      },
    },
    mouse: {
      wheel: async (_deltaX: number, deltaY: number) => {
        log.wheels.push(deltaY)
      },
    },
    // The read-only gate evaluates in-page ("editable" unless readOnly);
    // milestones pass their measure name as the argument.
    evaluate: async (_fn: unknown, arg?: unknown) => {
      if (typeof arg === 'string') log.measures.push(arg)
      return readOnly
    },
    // The read-only gate waits for the form to leave read-only; the
    // editable probe and all-fields check wait for their measure in-page
    waitForFunction: async (_fn: unknown, arg?: unknown) => {
      log.waitedFor.push(arg)
      if (!probeLands) throw new Error('Timeout 20000ms exceeded')
      readOnly = false
    },
    waitForTimeout: async () => {
      log.waits += 1
    },
  }
  return page
}

function fakeContext(
  page = createFakePage(),
): StepContext & {page: ReturnType<typeof createFakePage>} {
  return {
    page: page as unknown as StepContext['page'] & ReturnType<typeof createFakePage>,
    running: {} as StepContext['running'],
    timeoutMs: 1000,
    interruptions: {count: 0, totalMs: 0},
  }
}

describe('resolveLocator', () => {
  it('builds the composite input selector for a string field', () => {
    const locator = resolveLocator(createFakePage() as never, {
      field: 'stringField',
      kind: 'string',
    }) as unknown as FakeLocator
    expect(locator.selector).toBe(
      '[data-testid="field-stringField"] input[type="text"], [data-testid="field-stringField"] textarea',
    )
  })

  it('builds the contenteditable selector for a pte field', () => {
    const locator = resolveLocator(createFakePage() as never, {
      field: 'body',
      kind: 'pte',
    }) as unknown as FakeLocator
    expect(locator.selector).toBe('[data-testid="field-body"] [contenteditable="true"]')
  })

  it('scopes a testId selector under a within ancestor', () => {
    const locator = resolveLocator(createFakePage() as never, {
      testId: 'review-changes-button',
      within: 'document-panel',
    }) as unknown as FakeLocator
    expect(locator.selector).toBe('[data-testid="review-changes-button"]')
    expect(locator.scope).toBe('[data-testid="document-panel"]')
  })

  it('resolves a label selector via getByLabel scoped under within', () => {
    const locator = resolveLocator(createFakePage() as never, {
      label: 'Review changes',
      within: 'document-panel',
    }) as unknown as FakeLocator
    expect(locator.selector).toBe('Review changes')
    expect(locator.scope).toBe('[data-testid="document-panel"]')
    expect(locator.labelOptions).toEqual({exact: true})
  })

  it('passes a raw css selector through', () => {
    const locator = resolveLocator(createFakePage() as never, {
      css: '.some-thing',
    }) as unknown as FakeLocator
    expect(locator.selector).toBe('.some-thing')
  })
})

describe('runStep interaction counts', () => {
  it('click reports 1', async () => {
    const step: ScenarioStep = {kind: 'click', selector: {css: '.x'}}
    expect(await runStep(fakeContext(), step)).toEqual({interactions: 1})
  })

  it('awaitVisible reports 0', async () => {
    const step: ScenarioStep = {kind: 'awaitVisible', selector: {css: '.x'}}
    expect(await runStep(fakeContext(), step)).toEqual({interactions: 0})
  })

  it('hover reports 0', async () => {
    const step: ScenarioStep = {kind: 'hover', selector: {css: '.x'}}
    expect(await runStep(fakeContext(), step)).toEqual({interactions: 0})
  })

  it('raw reports its own count', async () => {
    const step: ScenarioStep = {
      kind: 'raw',
      label: 'custom',
      drive: async () => ({interactions: 7}),
    }
    expect(await runStep(fakeContext(), step)).toEqual({interactions: 7})
  })

  it('type with text reports focus click plus one interaction per character', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {kind: 'type', selector: {css: '.x'}, text: 'abcd'}
    expect(await runStep(context, step)).toEqual({interactions: 5})
    expect(context.page.log.typed).toEqual(['abcd'])
  })

  it('type with text waits out a read-only form before typing', async () => {
    const context = fakeContext(createFakePage({readOnly: true}))
    const step: ScenarioStep = {kind: 'type', selector: {css: '.x'}, text: 'abcd'}
    await runStep(context, step)
    expect(context.interruptions.count).toBe(1)
    expect(context.page.log.typed).toEqual(['abcd'])
  })

  it('type with keystrokes reports focus click plus the keystroke count', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {kind: 'type', selector: {css: '.x'}, keystrokes: 5}
    expect(await runStep(context, step)).toEqual({interactions: 6})
    expect(context.page.log.presses).toHaveLength(5)
  })

  it('scroll hovers the target, wheels `repeat` times and reports 0', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {
      kind: 'scroll',
      selector: {testId: 'document-panel-scroller'},
      deltaY: -400,
      repeat: 3,
    }
    expect(await runStep(context, step)).toEqual({interactions: 0})
    expect(context.page.log.hovers).toEqual(['[data-testid="document-panel-scroller"]'])
    expect(context.page.log.wheels).toEqual([-400, -400, -400])
  })

  it('scroll defaults to a single wheel tick', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {kind: 'scroll', selector: {css: '.x'}, deltaY: 200}
    await runStep(context, step)
    expect(context.page.log.wheels).toEqual([200])
  })

  it('press reports one interaction per repeat', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {kind: 'press', key: 'ArrowDown', repeat: 5}
    expect(await runStep(context, step)).toEqual({interactions: 5})
    expect(context.page.log.presses).toEqual(Array.from({length: 5}, () => 'ArrowDown'))
    expect(context.page.log.clicks).toEqual([])
  })

  it('press with a selector clicks it first and counts the click', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {
      kind: 'press',
      key: 'Enter',
      selector: {label: 'Search'},
    }
    expect(await runStep(context, step)).toEqual({interactions: 2})
    expect(context.page.log.clicks).toEqual(['Search'])
    expect(context.page.log.presses).toEqual(['Enter'])
  })
})

describe('runStep load steps', () => {
  it('awaitVisible records its milestone once visible', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {
      kind: 'awaitVisible',
      selector: {testId: 'pane'},
      milestone: 'tool visible',
    }
    expect(await runStep(context, step)).toEqual({interactions: 0})
    expect(context.page.log.measures).toEqual([milestoneMeasureName('tool visible')])
  })

  it('awaitVisible without a milestone records nothing', async () => {
    const context = fakeContext()
    await runStep(context, {kind: 'awaitVisible', selector: {testId: 'pane'}})
    expect(context.page.log.measures).toEqual([])
  })

  it('click with a milestone trial-clicks, records, then clicks', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {
      kind: 'click',
      selector: {css: 'a.login'},
      milestone: 'login clickable',
    }
    expect(await runStep(context, step)).toEqual({interactions: 1})
    expect(context.page.log.clicks).toEqual(['trial:a.login', 'a.login'])
    expect(context.page.log.measures).toEqual([milestoneMeasureName('login clickable')])
  })

  it('click without a milestone skips the trial click', async () => {
    const context = fakeContext()
    await runStep(context, {kind: 'click', selector: {css: '.x'}})
    expect(context.page.log.clicks).toEqual(['.x'])
  })

  it('awaitClickable trial-clicks and records without clicking', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {
      kind: 'awaitClickable',
      selector: {css: 'a.login'},
      milestone: 'login clickable',
    }
    expect(await runStep(context, step)).toEqual({interactions: 0})
    expect(context.page.log.clicks).toEqual(['trial:a.login'])
    expect(context.page.log.measures).toEqual([milestoneMeasureName('login clickable')])
  })

  it('awaitAllFieldsEditable waits in-page with the milestone measure and field floor', async () => {
    const context = fakeContext()
    const step: ScenarioStep = {
      kind: 'awaitAllFieldsEditable',
      milestone: 'all fields editable',
      minFields: 3,
    }
    expect(await runStep(context, step)).toEqual({interactions: 0})
    expect(context.page.log.waitedFor).toEqual([
      {measureName: milestoneMeasureName('all fields editable'), min: 3},
    ])
    // Recorded in-page by the predicate, not by a follow-up evaluate
    expect(context.page.log.measures).toEqual([])
  })

  it('awaitEditable clicks the field input and presses one key', async () => {
    const context = fakeContext()
    expect(await runStep(context, {kind: 'awaitEditable', field: 'stringField'})).toEqual({
      interactions: 2,
    })
    expect(context.page.log.clicks).toEqual([
      '[data-testid="field-stringField"] input[type="text"], ' +
        '[data-testid="field-stringField"] textarea, ' +
        '[data-testid="field-stringField"] [contenteditable="true"]',
    ])
    expect(context.page.log.presses).toEqual(['a'])
  })

  it('awaitEditable throws a probe-timeout naming the label when the keystroke never lands', async () => {
    const context = {
      ...fakeContext(createFakePage({probeLands: false})),
      label: 'boot-cold',
      diagnostics: () => ['console: boom'],
    }
    await expect(runStep(context, {kind: 'awaitEditable', field: 'title'})).rejects.toMatchObject({
      reason: 'probe-timeout',
      message: '[probe-timeout] probe keystroke never landed (boot-cold)',
      diagnostics: ['console: boom'],
    })
  })
})

describe('toTypeStep', () => {
  it('maps an interaction target to a field type step', () => {
    expect(toTypeStep({fieldPath: 'title', kind: 'string'})).toEqual({
      kind: 'type',
      selector: {field: 'title', kind: 'string'},
    })
  })
})
