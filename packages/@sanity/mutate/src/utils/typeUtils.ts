export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

export type NormalizeReadOnlyArray<T> = T extends readonly [
  infer NP,
  ...infer Rest,
]
  ? [NP, ...Rest]
  : T extends readonly (infer NP)[]
    ? NP[]
    : T

export type EmptyArray = never[] | readonly never[] | [] | readonly []
export type AnyArray<T = any> = T[] | readonly T[]

export type ArrayLength<T extends AnyArray> = T extends never[]
  ? 0
  : T['length']

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Formats an intersection object type, so it outputs as `{"foo": 1, "bar": 1}` instead of `{"foo": 1} & {"bar": 2}``
 */
export type Format<A> = A extends {[Key in keyof A]: A[Key]}
  ? {[Key in keyof A]: A[Key]}
  : A

// Similar to Arrify only that it preserves tuple information
export type Tuplify<T> = T extends readonly [infer NP, ...infer Rest]
  ? [NP, ...Rest]
  : T extends readonly (infer NP)[]
    ? NP[]
    : [T]
