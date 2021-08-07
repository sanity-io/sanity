import {SanityDocument} from './types'
export interface QuerySnapshotEvent {
  type: 'snapshot'
  documents: SanityDocument[]
}
export default function createDeprecatedAPIs(client: any): {}
