/**
 * Note; most of these are actually typed in individual packages, but fail to be resolved.
 * Investigate at some point (parts?)
 */

import {Path} from '../types'

export interface OperationsAPI {
  patch: {
    execute: (patches: any[]) => void
  }
}

export interface SetPatch {
  op: 'set'
  path: Path
  value: unknown
}

export interface UnsetPatch {
  op: 'unset'
  path: Path
}

export interface InsertPatch {
  op: 'insert'
  after: Path
  items: any[]
}

export type DiffPatch = SetPatch | UnsetPatch | InsertPatch
