import {type DiffMatchPatch} from './DiffMatchPatch'
import {type IncPatch} from './IncPatch'
import {type InsertPatch} from './InsertPatch'
import {type SetIfMissingPatch} from './SetIfMissingPatch'
import {type SetPatch} from './SetPatch'
import {type UnsetPatch} from './UnsetPatch'
import {type PatchOperations} from '@sanity/types'

export type PatchTypes =
  | DiffMatchPatch
  | IncPatch
  | InsertPatch
  | SetIfMissingPatch
  | SetPatch
  | UnsetPatch

export type SingleDocumentPatch = PatchOperations & {id: string}
