import {Instrumenter} from '@stryker-mutator/instrumenter'
import {describe, expect, test} from 'vitest'

import {messageIgnorer, strykerPlugins} from '../../stryker/messageIgnorer'

const silentLogger = {
  isTraceEnabled: () => false,
  isDebugEnabled: () => false,
  isInfoEnabled: () => false,
  isWarnEnabled: () => false,
  isErrorEnabled: () => false,
  isFatalEnabled: () => false,
  trace: () => undefined,
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  fatal: () => undefined,
}

async function mutantsOf(source: string) {
  const instrumenter = new Instrumenter(silentLogger)
  const result = await instrumenter.instrument(
    [{name: 'example.ts', content: source, mutate: true}],
    {plugins: null, excludedMutations: [], ignorers: [messageIgnorer]},
  )
  return result.mutants.map((mutant) => ({
    mutatorName: mutant.mutatorName,
    replacement: mutant.replacement,
    ignored: mutant.status === 'Ignored',
    line: mutant.location.start.line,
  }))
}

function ignoredReplacementsOf(mutants: Awaited<ReturnType<typeof mutantsOf>>) {
  return mutants.filter((mutant) => mutant.ignored).map((mutant) => mutant.replacement)
}

function scoredReplacementsOf(mutants: Awaited<ReturnType<typeof mutantsOf>>) {
  return mutants.filter((mutant) => mutant.ignored === false).map((mutant) => mutant.replacement)
}

function scoredMutatorsOf(mutants: Awaited<ReturnType<typeof mutantsOf>>) {
  return mutants.filter((mutant) => mutant.ignored === false).map((mutant) => mutant.mutatorName)
}

describe('messageIgnorer', () => {
  test('ignores the message of a thrown error but scores the throw, its condition and its block', async () => {
    const mutants = await mutantsOf(
      [
        'export function check(value: number) {',
        "  if (value > 1) throw new Error('too big')",
        '}',
      ].join('\n'),
    )

    expect(ignoredReplacementsOf(mutants)).toEqual(['""'])
    expect(scoredReplacementsOf(mutants)).toContain(';')
    expect(scoredMutatorsOf(mutants)).toEqual(
      expect.arrayContaining(['ConditionalExpression', 'BlockStatement', 'EqualityOperator']),
    )
  })

  test('keeps removal of a throw scored when the message is a template literal on a custom error', async () => {
    const mutants = await mutantsOf(
      [
        'export function fail(opName: string) {',
        '  throw new DeadlineExceededError(`Called ${opName} too early`)',
        '}',
      ].join('\n'),
    )

    const stringMutants = mutants.filter((mutant) => mutant.mutatorName === 'StringLiteral')
    expect(stringMutants.length).toBeGreaterThan(0)
    expect(stringMutants.every((mutant) => mutant.ignored)).toBe(true)
    expect(scoredReplacementsOf(mutants)).toContain(';')
  })

  test('ignores only the first argument of an error construction', async () => {
    const mutants = await mutantsOf(
      ["export const make = () => new HttpError('not found', 'NOT_FOUND')"].join('\n'),
    )

    const stringMutants = mutants.filter((mutant) => mutant.mutatorName === 'StringLiteral')
    expect(stringMutants.map((mutant) => mutant.ignored)).toEqual([true, false])
  })

  test('does not treat functions that merely end in Error as error classes', async () => {
    const mutants = await mutantsOf(
      ["export const handler = () => catchError(() => 'fallback')"].join('\n'),
    )

    const stringMutants = mutants.filter((mutant) => mutant.mutatorName === 'StringLiteral')
    expect(stringMutants.length).toBeGreaterThan(0)
    expect(stringMutants.every((mutant) => mutant.ignored === false)).toBe(true)
  })

  test('ignores debug and console call statements, including their arguments', async () => {
    const mutants = await mutantsOf(
      [
        'export function run(debug: (message: string) => void) {',
        "  debug('Staged local mutation')",
        "  console.warn('Unsupported patch type')",
        '}',
      ].join('\n'),
    )

    const stringMutants = mutants.filter((mutant) => mutant.mutatorName === 'StringLiteral')
    expect(stringMutants).toHaveLength(2)
    expect(stringMutants.every((mutant) => mutant.ignored)).toBe(true)
    expect(ignoredReplacementsOf(mutants)).toEqual(expect.arrayContaining([';']))
    expect(scoredMutatorsOf(mutants)).toEqual(['BlockStatement'])
  })

  test('ignores a log call used as an expression', async () => {
    const mutants = await mutantsOf(
      ["export const log = (enabled: boolean) => enabled && console.log('ready')"].join('\n'),
    )

    const stringMutants = mutants.filter((mutant) => mutant.mutatorName === 'StringLiteral')
    expect(stringMutants.every((mutant) => mutant.ignored)).toBe(true)
  })

  test('keeps load-bearing strings scored', async () => {
    const mutants = await mutantsOf(
      [
        "export const EDIT_ACTION = 'sanity.action.document.edit'",
        'export function makeAction(id: string) {',
        "  return {actionType: 'sanity.action.document.edit', documentId: id}",
        '}',
      ].join('\n'),
    )

    const stringMutants = mutants.filter((mutant) => mutant.mutatorName === 'StringLiteral')
    expect(stringMutants.length).toBeGreaterThan(0)
    expect(stringMutants.every((mutant) => mutant.ignored === false)).toBe(true)
  })

  test('keeps a string scored when it is not an argument of an error or logger', async () => {
    const mutants = await mutantsOf(
      [
        'export function pick(items: string[]) {',
        "  return items.includes('draft') ? new Error('boom') : fetchDocument('draft')",
        '}',
      ].join('\n'),
    )

    const stringMutants = mutants.filter((mutant) => mutant.mutatorName === 'StringLiteral')
    expect(stringMutants.map((mutant) => mutant.ignored)).toEqual([false, true, false])
  })
})

describe('strykerPlugins', () => {
  test('declares one ignore plugin under the name the configs reference', () => {
    expect(strykerPlugins).toHaveLength(1)
    expect(strykerPlugins[0]).toMatchObject({kind: 'Ignore', name: 'engine-confidence-messages'})
  })
})
