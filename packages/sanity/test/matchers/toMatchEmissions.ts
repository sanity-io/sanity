import {type AsyncExpectationResult, type MatcherState} from '@vitest/expect'
import {firstValueFrom, type OperatorFunction, Subject, toArray} from 'rxjs'

export const NO_EMISSION = Symbol('NO_EMISSION')

type Snapshot<A, B> = [A, B | typeof NO_EMISSION]

interface OperatorFunctionMatchers<Type = unknown> {
  /**
   * Ensure each entry in the provided array results in the expected value being emitted when piped
   * to the observable.
   */
  toMatchEmissions: Type extends () => OperatorFunction<infer A, infer B>
    ? (snapshots: Snapshot<A, B>[]) => Promise<Type>
    : never
}

declare module 'vitest' {
  interface Assertion<T = any> extends OperatorFunctionMatchers<T> {}
  interface AsymmetricMatchersContaining extends OperatorFunctionMatchers {}
}

export async function toMatchEmissions(
  this: MatcherState,
  createOperator: () => OperatorFunction<unknown, unknown>,
  snapshots: [A: unknown, B: unknown][],
): AsyncExpectationResult {
  const {equals} = this
  const input$ = new Subject()

  const expectedEmissions = snapshots
    .filter(([, expectedEmission]) => expectedEmission !== NO_EMISSION)
    .map(([, expectedEmission]) => expectedEmission)

  const emissions$ = input$.pipe(createOperator(), toArray())
  const emissions = firstValueFrom(emissions$)

  snapshots.forEach(([value]) => input$.next(value))
  input$.complete()

  const actualEmissions = await emissions

  return {
    pass: equals(actualEmissions, expectedEmissions),
    message: () => 'Observable emissions did not match',
    actual: actualEmissions,
    expected: expectedEmissions,
  }
}
