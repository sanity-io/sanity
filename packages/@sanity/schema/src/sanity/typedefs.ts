import type {SchemaType} from '@sanity/types'

/**
 * @internal
 */
export type _FIXME_ = any

export interface TypeDef {
  name: string
  type: string
  title?: string
  description?: string
  options?: Record<string, any>
}

export interface SchemaDef {
  name: string
  types: TypeDef[]
}

/**
 * @internal
 */
export interface SchemaValidationResult {
  severity: 'warning' | 'info' | 'error'
  message: string
  helpId?: string
}

/**
 * @internal
 */
export interface TypeWithProblems {
  path: ProblemPath
  problems: SchemaValidationResult[]
}

/**
 * @internal
 */
export interface ProblemPathTypeSegment {
  kind: 'type'
  type: SchemaType
  name: string
}

/**
 * @internal
 */
export interface ProblemPathPropertySegment {
  kind: 'property'
  name: string
}

/**
 * @internal
 */
export type ProblemPathSegment = ProblemPathTypeSegment | ProblemPathPropertySegment

/**
 * @internal
 */
export type ProblemPath = ProblemPathSegment[]
