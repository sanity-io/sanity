import type * as t from '@babel/types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  (typeof value === 'object' || typeof value === 'function') && !!value

/**
 * Statistics from the query type evaluation process.
 * @public
 */
export interface TypeEvaluationStats {
  allTypes: number
  unknownTypes: number
  emptyUnions: number
}

interface QueryVariable {
  id: t.Identifier
  start?: number
  end?: number
}

/**
 * A GROQ query extracted from a source file.
 * @public
 */
export interface ExtractedQuery {
  variable: QueryVariable
  query: string
  filename: string
}

/**
 * A module (file) containing extracted GROQ queries.
 * @public
 */
export interface ExtractedModule {
  filename: string
  queries: ExtractedQuery[]
  errors: QueryExtractionError[]
}

/**
 * An `ExtractedQuery` that has been evaluated against a schema, yielding a TypeScript type.
 * @public
 */
export interface EvaluatedQuery extends ExtractedQuery {
  id: t.Identifier
  code: string
  tsType: t.TSType
  ast: t.ExportNamedDeclaration
  stats: TypeEvaluationStats
}

/**
 * A module containing queries that have been evaluated.
 * @public
 */
export interface EvaluatedModule {
  filename: string
  queries: EvaluatedQuery[]
  errors: (QueryExtractionError | QueryEvaluationError)[]
}

interface QueryExtractionErrorOptions {
  variable?: QueryVariable
  cause: unknown
  filename: string
}

/**
 * An error that occurred during query extraction.
 * @public
 */
export class QueryExtractionError extends Error {
  variable?: QueryVariable
  filename: string
  constructor({variable, cause, filename}: QueryExtractionErrorOptions) {
    super(
      `Error while extracting query ${variable ? `from variable '${variable.id.name}' ` : ''}in ${filename}: ${
        isRecord(cause) && typeof cause.message === 'string' ? cause.message : 'Unknown error'
      }`,
    )
    this.name = 'QueryExtractionError'
    this.cause = cause
    this.variable = variable
    this.filename = filename
  }
}

interface QueryEvaluationErrorOptions {
  variable?: QueryVariable
  cause: unknown
  filename: string
}

/**
 * An error that occurred during query evaluation.
 * @public
 */
export class QueryEvaluationError extends Error {
  variable?: QueryVariable
  filename: string
  constructor({variable, cause, filename}: QueryEvaluationErrorOptions) {
    super(
      `Error while evaluating query ${variable ? `from variable '${variable.id.name}' ` : ''}in ${filename}: ${
        isRecord(cause) && typeof cause.message === 'string' ? cause.message : 'Unknown error'
      }`,
    )
    this.name = 'QueryEvaluationError'
    this.cause = cause
    this.variable = variable
    this.filename = filename
  }
}
