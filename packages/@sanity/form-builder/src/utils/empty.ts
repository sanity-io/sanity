export const EMPTY_OBJECT: any = Object.freeze({})
export const EMPTY_ARRAY: any = Object.freeze([])
export const emptyObject = <T>() => EMPTY_OBJECT as T

export const emptyArray = <T>() => EMPTY_ARRAY as T
