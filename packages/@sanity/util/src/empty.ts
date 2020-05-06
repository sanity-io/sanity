const EMPTY_OBJECT: unknown = Object.freeze({})
const EMPTY_ARRAY: unknown = Object.freeze([])

export const emptyObject = <T = {}>() => EMPTY_OBJECT as T
export const emptyArray = <T = unknown>() => EMPTY_ARRAY as T[]
