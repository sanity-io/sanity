import {type AsyncExpectationResult, type MatcherState} from '@vitest/expect'
import {firstValueFrom, type OperatorFunction, Subject, toArray} from 'rxjs'

export const NO_EMISSION = Symbol('NO_EMISSION')

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
