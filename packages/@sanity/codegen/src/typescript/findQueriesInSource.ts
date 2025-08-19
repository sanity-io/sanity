import {ancestor as walk} from 'acorn-walk'
import {type Program} from 'estree'

import {resolveExpression, type ResolveExpressionContext} from './expressionResolvers'
import {proxyRollupRangeToEstree} from './helpers'
import {type Comment} from './parseComments'
import {getModuleScope, getVariableScope} from './scope'
import {
  type ExtractedModule,
  isQueryVariableDeclarator,
  QueryEvaluationError,
  QueryExtractionError,
  type QueryExtractionResult,
  type QueryVariableDeclarator,
  t,
} from './types'

const ignoreValue = '@sanity-typegen-ignore'
type AcornNode = Parameters<typeof walk>[0]

export interface FindQueriesInSourceOptions {
  program: Program
  comments: Comment[]
  filename: string
  context: ResolveExpressionContext
}

export async function findQueriesInSource({
  program: rollupProgram,
  filename,
  context,
}: FindQueriesInSourceOptions): Promise<ExtractedModule> {
  const program = proxyRollupRangeToEstree(rollupProgram)
  getModuleScope(program) // ensure scope manager is cached

  const queryVariables: QueryVariableDeclarator[] = []

  walk(program as Extract<AcornNode, {type: 'Program'}>, {
    VariableDeclarator(...args) {
      const [, , ancestors] = args
      const variableDeclarator = ancestors.at(-1)
      const variableDeclaration = ancestors.at(-2)
      const declarationParent = ancestors.at(-3)

      if (!t.isVariableDeclarator(variableDeclarator)) return
      if (!t.isVariableDeclaration(variableDeclaration)) return
      if (!declarationParent) return

      if (isQueryVariableDeclarator(node)) {
        queryVariables.push(node)
      }
    },
  })

  const results = await Promise.all(
    queryVariables.map((variable) =>
      extractQuery({
        variable,
        filename,
        context: {
          ...context,
          load: async (moduleId) =>
            // ensure the program node is compatible with ESTree ranges
            proxyRollupRangeToEstree(await context.load(moduleId)),
        },
      }).catch((error) => {
        if (error instanceof QueryExtractionError || error instanceof QueryEvaluationError) {
          return Object.assign(error, {message: error.message})
        }
        throw error
      }),
    ),
  )

  const queries: QueryExtractionResult[] = []
  const errors: (QueryExtractionError | QueryEvaluationError)[] = []

  for (const result of results) {
    if (result.type === 'query')
      queries.push({
        ...result,
        // Deep clone the variable object to ensure it's serializable for worker thread transfer.
        variable: JSON.parse(JSON.stringify(result.variable)),
      })
    if (result.type === 'error') errors.push(result)
  }

  return {filename, queries, documentProjections: [], errors}
}

interface ExtractQueryOptions {
  filename: string
  variable: QueryVariableDeclarator
  context: ResolveExpressionContext
}

async function extractQuery({
  variable,
  filename,
  context,
}: ExtractQueryOptions): Promise<QueryExtractionResult> {
  try {
    const query = await resolveExpression({
      node: variable.init,
      scope: getVariableScope(variable),
      filename,
      context,
    })

    return {type: 'query', query, variable, filename}
  } catch (cause) {
    throw new QueryExtractionError({variable, cause, filename})
  }
}
