import {describe, expect, it} from 'vitest'

import {type ScenarioStep, type StepContext} from '../../../scenarios/types'
import {resolveLocator, runStep, toTypeStep} from '../steps'

interface FakeLocator {
  selector: string
  scope?: string
  first: () => FakeLocator
  locator: (inner: string) => FakeLocator
  waitFor: () => Promise<void>
  hover: () => Promise<void>
  click: () => Promise<void>
}

function makeLocator(selector: string, scope?: string): FakeLocator {
  const locator: FakeLocator = {
    selector,
    scope,
    first: () => locator,
    locator: (inner) => makeLocator(inner, selector),
    waitFor: async () => {},
    hover: async () => {},
    click: async () => {},
  }
  return locator
}

function createFakePage() {
  return {locator: (selector: string) => makeLocator(selector)}
}

function fakeContext(): StepContext {
  return {
    page: createFakePage() as unknown as StepContext['page'],
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
      testId: 'add-comment-button',
      within: 'field-stringField',
    }) as unknown as FakeLocator
    expect(locator.selector).toBe('[data-testid="add-comment-button"]')
    expect(locator.scope).toBe('[data-testid="field-stringField"]')
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
})

describe('toTypeStep', () => {
  it('maps an interaction target to a field type step', () => {
    expect(toTypeStep({fieldPath: 'title', kind: 'string'})).toEqual({
      kind: 'type',
      selector: {field: 'title', kind: 'string'},
    })
  })
})
