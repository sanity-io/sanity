import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {
  findQueriesInPath,
  getResolver,
  readSchema,
  registerBabel,
  safeParseQuery,
  TypeGenerator,
} from '@sanity/codegen'
import createDebug from 'debug'
import {typeEvaluate, type TypeNode} from 'groq-js'
import {format as prettierFormat, type Options as PrettierOptions} from 'prettier'

const $info = createDebug('sanity:codegen:generate:info')
const $warn = createDebug('sanity:codegen:generate:warn')

export interface TypegenGenerateTypesWorkerData {
  workDir: string
  workspaceName?: string
  schemaPath: string
  searchPath: string | string[]
  prettierConfig: PrettierOptions | null
}

export type TypegenGenerateTypesWorkerMessage =
  | {
      type: 'error'
      error: Error
      fatal: boolean
      query?: string
      filename?: string
    }
  | {
      type: 'types'
      filename: string
      types: {
        queryName: string
        query: string
        type: string
        unknownTypeNodesGenerated: number
        typeNodesGenerated: number
        emptyUnionTypeNodesGenerated: number
      }[]
    }
  | {
      type: 'schema'
      filename: string
      schema: string
      length: number
    }
  | {
      type: 'complete'
    }

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const opts = _workerData as TypegenGenerateTypesWorkerData

registerBabel()

function maybeFormatCode(code: string, prettierConfig: PrettierOptions | null): Promise<string> {
  if (!prettierConfig) {
    return Promise.resolve(code)
  }

  try {
    return prettierFormat(code, {
      ...prettierConfig,
      parser: 'typescript' as const,
    })
  } catch (err) {
    $warn(`Error formatting: ${err.message}`)
  }
  return Promise.resolve(code)
}

async function main() {
  const schema = await readSchema(opts.schemaPath)

  const typeGenerator = new TypeGenerator(schema)
  const schemaTypes = await maybeFormatCode(
    [typeGenerator.generateSchemaTypes(), TypeGenerator.generateKnownTypes()].join('\n'),
    opts.prettierConfig,
  )
  const resolver = getResolver()

  parentPort?.postMessage({
    type: 'schema',
    schema: schemaTypes,
    filename: 'schema.json',
    length: schema.length,
  } satisfies TypegenGenerateTypesWorkerMessage)

  const queries = findQueriesInPath({
    path: opts.searchPath,
    resolver,
  })

  for await (const result of queries) {
    if (result.type === 'error') {
      parentPort?.postMessage({
        type: 'error',
        error: result.error,
        fatal: false,
        filename: result.filename,
      } satisfies TypegenGenerateTypesWorkerMessage)
      continue
    }
    $info(`Processing ${result.queries.length} queries in "${result.filename}"...`)

    const fileQueryTypes: {
      queryName: string
      query: string
      type: string
      unknownTypeNodesGenerated: number
      typeNodesGenerated: number
      emptyUnionTypeNodesGenerated: number
    }[] = []
    for (const {name: queryName, result: query} of result.queries) {
      try {
        const ast = safeParseQuery(query)
        const queryTypes = typeEvaluate(ast, schema)

        const type = await maybeFormatCode(
          typeGenerator.generateTypeNodeTypes(`${queryName}Result`, queryTypes),
          opts.prettierConfig,
        )

        const queryTypeStats = walkAndCountQueryTypeNodeStats(queryTypes)
        fileQueryTypes.push({
          queryName,
          query,
          type,
          unknownTypeNodesGenerated: queryTypeStats.unknownTypes,
          typeNodesGenerated: queryTypeStats.allTypes,
          emptyUnionTypeNodesGenerated: queryTypeStats.emptyUnions,
        })
      } catch (err) {
        parentPort?.postMessage({
          type: 'error',
          error: new Error(
            `Error generating types for query "${queryName}" in "${result.filename}": ${err.message}`,
            {cause: err},
          ),
          fatal: false,
          query,
        } satisfies TypegenGenerateTypesWorkerMessage)
      }
    }

    if (fileQueryTypes.length > 0) {
      $info(`Generated types for ${fileQueryTypes.length} queries in "${result.filename}"\n`)
      parentPort?.postMessage({
        type: 'types',
        types: fileQueryTypes,
        filename: result.filename,
      } satisfies TypegenGenerateTypesWorkerMessage)
    }
  }

  parentPort?.postMessage({
    type: 'complete',
  } satisfies TypegenGenerateTypesWorkerMessage)
}

function walkAndCountQueryTypeNodeStats(typeNode: TypeNode): {
  allTypes: number
  unknownTypes: number
  emptyUnions: number
} {
  switch (typeNode.type) {
    case 'unknown': {
      return {allTypes: 1, unknownTypes: 1, emptyUnions: 0}
    }
    case 'array': {
      const acc = walkAndCountQueryTypeNodeStats(typeNode.of)
      acc.allTypes += 1 // count the array type itself
      return acc
    }
    case 'object': {
      // if the rest is unknown, we count it as one unknown type
      if (typeNode.rest && typeNode.rest.type === 'unknown') {
        return {allTypes: 2, unknownTypes: 1, emptyUnions: 0} // count the object type itself as well
      }

      const restStats = typeNode.rest
        ? walkAndCountQueryTypeNodeStats(typeNode.rest)
        : {allTypes: 1, unknownTypes: 0, emptyUnions: 0} // count the object type itself

      return Object.values(typeNode.attributes).reduce((acc, attribute) => {
        const {allTypes, unknownTypes, emptyUnions} = walkAndCountQueryTypeNodeStats(
          attribute.value,
        )
        return {
          allTypes: acc.allTypes + allTypes,
          unknownTypes: acc.unknownTypes + unknownTypes,
          emptyUnions: acc.emptyUnions + emptyUnions,
        }
      }, restStats)
    }
    case 'union': {
      if (typeNode.of.length === 0) {
        return {allTypes: 1, unknownTypes: 0, emptyUnions: 1}
      }

      return typeNode.of.reduce(
        (acc, type) => {
          const {allTypes, unknownTypes, emptyUnions} = walkAndCountQueryTypeNodeStats(type)
          return {
            allTypes: acc.allTypes + allTypes,
            unknownTypes: acc.unknownTypes + unknownTypes,
            emptyUnions: acc.emptyUnions + emptyUnions,
          }
        },
        {allTypes: 1, unknownTypes: 0, emptyUnions: 0}, // count the union type itself
      )
    }
    default: {
      return {allTypes: 1, unknownTypes: 0, emptyUnions: 0}
    }
  }
}

main()
