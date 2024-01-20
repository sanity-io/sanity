import {type SingleDocumentPatch} from '../../src/patch/types'

export interface PatchExample {
  name: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  patch: SingleDocumentPatch | SingleDocumentPatch[]
}
