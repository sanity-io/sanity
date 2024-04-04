import {type ObjectDiff as AgnosticObjectDiff} from '@sanity/diff'
import {type Path, type SanityDocument, type SchemaType} from '@sanity/types'
import {type ComponentType, createContext, type ReactNode} from 'react'

/**
 * History timeline / chunking
 *
 *
 * @hidden
 * @beta
 */
export type ChunkType =
  | 'initial'
  | 'create'
  | 'editDraft'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'discardDraft'
  | 'editLive'

/**
 * @hidden
 * @beta */
export type Chunk = {
  index: number

  id: string
  type: ChunkType
  start: number
  end: number
  startTimestamp: string
  endTimestamp: string
  authors: Set<string>
  draftState: 'present' | 'missing' | 'unknown'
  publishedState: 'present' | 'missing' | 'unknown'
}

/**
 * Annotation connected to a change
 *
 *
 * @hidden
 * @beta
 */
export type AnnotationDetails = {
  chunk: Chunk
  timestamp: string
  author: string
}

/**
 * @hidden
 * @beta */
export type Annotation = AnnotationDetails | null

/** @internal */
export type ObjectDiff<T extends object = Record<string, any>> = AgnosticObjectDiff<Annotation, T>

/** @internal */
export type DocumentChangeContextInstance = {
  documentId: string
  schemaType: SchemaType
  rootDiff: ObjectDiff | null
  isComparingCurrent: boolean
  FieldWrapper: ComponentType<{path: Path; children: ReactNode; hasHover: boolean}>
  value: Partial<SanityDocument>
}

/** @internal */
export const DocumentChangeContext = createContext<DocumentChangeContextInstance | null>(null)
