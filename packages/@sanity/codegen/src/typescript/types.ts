import {type ExportNamedDeclaration, type TSType} from '@babel/types'
import {type Scope} from 'eslint-scope'
import {
  type Expression,
  type Identifier,
  type Literal,
  type Node,
  type VariableDeclarator,
} from 'estree'

import {getVariableScope} from './scope'

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
  id: Identifier
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

type PrefixIs<K extends string> = `is${K}`
type UnwrapIs<K extends `is${string}`> = K extends `is${infer U}` ? U : K

type X = {
  [TType in PrefixIs<Node['type']>]: (
    node: unknown,
  ) => node is Extract<Node, {type: UnwrapIs<TType>}>
}

export const t = new Proxy({} as X, {
  get: (...args) => {
    const [, property] = args
    if (typeof property !== 'string' || !property.startsWith('is')) return Reflect.get(...args)

    return (node: unknown) => isObject(node) && 'type' in node && node.type === property.slice(2)
  },
})

export const isObject = (node: unknown): node is object => !!node && typeof node === 'object'

export type QueryVariableDeclarator = {
  id: Identifier
  init: Expression
} & VariableDeclarator

export function isQueryVariableDeclarator(node: Node): node is QueryVariableDeclarator {
  if (!t.isVariableDeclarator(node)) return false
  if (!t.isIdentifier(node.id)) return false
  if (!node.init) return false
  return isGroqTagged(node.init) || isDefineQueryCall(node.init, getVariableScope(node))
}

// TODO: de-dupe
const groqTagName = 'groq'

function isGroqTagged(node: Node | null | undefined) {
  return (
    t.isTaggedTemplateExpression(node) && t.isIdentifier(node.tag) && node.tag.name === groqTagName
  )
}

const defineQueryFunctionName = 'defineQuery'
const defineQueryAllowedSources = new Set<unknown>(['groq', 'next-sanity'])

export function isDefineQueryCall(node: Node | null | undefined, scope: Scope) {
  if (!scope) return false
  if (!t.isCallExpression(node)) return false
  if (!t.isIdentifier(node.callee)) return false

  const {callee} = node
  const resolved = scope.references.find((ref) => ref.identifier.name === callee.name)?.resolved
  if (!resolved) return false

  const def = resolved.defs.at(0)
  if (!def) return false

  if (def.type !== 'ImportBinding') return false
  if (!t.isImportSpecifier(def.node)) return false
  if (!t.isIdentifier(def.node.imported)) return false
  if (def.node.imported.name !== defineQueryFunctionName) return false

  const {source} = def.parent
  return defineQueryAllowedSources.has(source.value)
}

export function isSpecifierValuesEqual(a: Identifier | Literal, b: Identifier | Literal): boolean {
  if (a === b) return true
  if (t.isIdentifier(a)) return isSpecifierValuesEqual({type: 'Literal', value: a.name}, b)
  if (t.isIdentifier(b)) return isSpecifierValuesEqual(a, {type: 'Literal', value: b.name})
  return a.value === b.value
}

export interface QueryExtractionResult {
  type: 'query'
  /** name is the name of the query */
  variable: QueryVariable
  /** result is a groq query */
  query: string
  filename: string
}

export interface ExtractedDocumentProjection {
  variable: QueryVariable
  projection: string
  documentTypes: string[]
  filename: string
}

/**
 * A module (file) containing extracted GROQ queries.
 * @public
 */
export interface ExtractedModule {
  filename: string
  queries: ExtractedQuery[]
  documentProjections: ExtractedDocumentProjection[]
  errors: QueryExtractionError[]
}

/**
 * An `ExtractedQuery` that has been evaluated against a schema, yielding a TypeScript type.
 * @public
 */
export interface EvaluatedQuery extends ExtractedQuery {
  id: Identifier
  code: string
  tsType: TSType
  ast: ExportNamedDeclaration
  stats: TypeEvaluationStats
}

export interface EvaluatedDocumentProjection extends ExtractedDocumentProjection {
  id: Identifier
  code: string
  tsType: TSType
  ast: ExportNamedDeclaration
  stats: TypeEvaluationStats
}

/**
 * A module containing queries that have been evaluated.
 * @public
 */
export interface EvaluatedModule {
  filename: string
  queries: EvaluatedQuery[]
  documentProjections: EvaluatedDocumentProjection[]
  errors: (QueryExtractionError | QueryEvaluationError)[]
}

interface QueryExtractionErrorOptions {
  type?: 'query' | 'documentProjection'
  variable?: QueryVariable
  cause: unknown
  filename: string
}

/**
 * An error that occurred during query extraction.
 * @public
 */
export class QueryExtractionError extends Error {
  type = 'error' as const
  variable?: QueryVariable
  filename: string
  constructor({type, variable, cause, filename}: QueryExtractionErrorOptions) {
    super(
      `Error while extracting ${type === 'documentProjection' ? 'document projection' : 'query'} ` +
        `${variable ? `from variable '${variable.id.name}' ` : ''}in ${filename}: ${
          isRecord(cause) && typeof cause.message === 'string' ? cause.message : 'Unknown error'
        }`,
    )
    this.name = 'QueryExtractionError'
    this.cause = cause
    this.variable = variable
    this.filename = filename
  }
}

export class QueryEvaluationError extends Error {
  type = 'error' as const
  variable?: QueryVariable
  filename: string
  constructor({type, variable, cause, filename}: QueryExtractionErrorOptions) {
    super(
      `Error while evaluating ${type === 'documentProjection' ? 'document projection' : 'query'} ` +
        `${variable ? `from variable '${variable.id.name}' ` : ''}in ${filename}: ${
          isRecord(cause) && typeof cause.message === 'string' ? cause.message : 'Unknown error'
        }`,
    )
    this.name = 'QueryEvaluationError'
    this.cause = cause
    this.variable = variable
    this.filename = filename
  }
}
