import {RawPatch} from './patch'
export declare type Value<T> = {
  data?: unknown
  content?: Content<T>
  startMeta: T
  endMeta: T
}
export declare type Type = 'array' | 'string' | 'object' | 'number' | 'boolean' | 'null'
export declare type Content<T> = ObjectContent<T> | ArrayContent<T> | StringContent<T>
export declare type ObjectContent<T> = {
  type: 'object'
  fields: {
    [key: string]: Value<T>
  }
}
export declare type ArrayContent<T> = {
  type: 'array'
  elements: Value<T>[]
  metas: T[]
}
export declare type StringContent<T> = {
  type: 'string'
  parts: StringPart<T>[]
}
export declare type StringPart<T> = {
  value: string
  utf8size: number
  uses: StringContent<T>[]
  startMeta: T
  endMeta: T
}
export declare function wrap<T>(data: unknown, meta: T): Value<T>
export declare function unwrap<T>(value: Value<T>): unknown
export declare function getType<T>(value: Value<T>): Type
export declare function rebaseValue<T>(left: Value<T>, right: Value<T>): Value<T>
export declare function applyPatch<T>(left: Value<T>, patch: RawPatch, startMeta: T): Value<T>
