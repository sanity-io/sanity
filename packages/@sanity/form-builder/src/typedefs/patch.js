// @flow

import type {Path} from './path'

type JSONValue = number | string | boolean | {[string]: JSONValue} | JSONValue[]

export type Origin = 'remote' | 'local'

export type SetPatch = {
  path: Path,
  type: 'set',
  origin: Origin,
  value: JSONValue
}

export type SetIfMissingPatch = {
  path: Path,
  origin: Origin,
  type: 'setIfMissing',
  value: JSONValue
}

export type UnsetPatch = {
  path: Path,
  origin: Origin,
  type: 'unset'
}

export type InsertPatch = {
  path: Path,
  origin: Origin,
  type: 'insert',
  position: 'before' | 'after',
  items: JSONValue[]
}

export type Patch = SetPatch | SetIfMissingPatch | UnsetPatch | InsertPatch
