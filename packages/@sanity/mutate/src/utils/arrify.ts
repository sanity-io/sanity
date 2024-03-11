export type Arrify<T> = (T extends (infer E)[] ? E : T)[]

export function arrify<T>(val: T): Arrify<T> {
  return Array.isArray(val) ? val : ([val] as any)
}
