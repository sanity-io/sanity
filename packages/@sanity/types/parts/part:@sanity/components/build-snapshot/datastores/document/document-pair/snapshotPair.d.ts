import {IdPair, SanityDocument, Mutation} from '../types'
import {Observable} from 'rxjs'
export interface DocumentVersionSnapshots {
  snapshots$: Observable<SanityDocument>
  patch: (patches: any) => Mutation[]
  create: (document: any) => Mutation
  createIfNotExists: (document: any) => Mutation
  createOrReplace: (document: any) => Mutation
  delete: () => Mutation
  mutate: (mutations: Mutation[]) => void
  commit: () => Observable<never>
}
interface SnapshotPair {
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}
export declare const snapshotPair: (arg1: IdPair) => Observable<SnapshotPair>
export {}
