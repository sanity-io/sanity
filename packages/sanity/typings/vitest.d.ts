import {type OperatorFunction} from 'rxjs'

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

export {}
