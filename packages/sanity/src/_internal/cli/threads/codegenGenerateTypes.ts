import {
  findQueriesInPath,
  getResolver,
  readSchema,
  registerBabel,
  TypeGenerator,
} from '@sanity/codegen'
import createDebug from 'debug'
import {parse, typeEvaluate, type TypeNode} from 'groq-js'
import {isMainThread, parentPort, workerData as _workerData} from 'worker_threads'

const $info = createDebug('sanity:codegen:generate:info')

export interface CodegenGenerateTypesWorkerData {
  workDir: string
  workspaceName?: string
  schemaPath: string
  searchPath: string | string[]
}

export type CodegenGenerateTypesWorkerMessage =
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
        unknownTypes: number
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

const opts = _workerData as CodegenGenerateTypesWorkerData

registerBabel()

async function main() {
  const schema = await readSchema(opts.schemaPath)

  const typeGenerator = new TypeGenerator(schema)
  const schemaTypes = typeGenerator.generateSchemaTypes()
  const resolver = getResolver()

  parentPort?.postMessage({
    type: 'schema',
    schema: schemaTypes,
    filename: 'schema.json',
    length: schema.length,
  } satisfies CodegenGenerateTypesWorkerMessage)

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
      } satisfies CodegenGenerateTypesWorkerMessage)
      continue
    }
    $info(`Processing ${result.queries.length} queries in "${result.filename}"...`)

    const fileQueryTypes: {queryName: string; query: string; type: string; unknownTypes: number}[] =
      []
    for (const {name: queryName, result: query} of result.queries) {
      try {
        const ast = parse(query)
        const queryTypes = typeEvaluate(ast, schema)

        const type = typeGenerator.generateTypeNodeTypes(queryName, queryTypes)

        fileQueryTypes.push({
          queryName: queryName,
          query,
          type,
          unknownTypes: countUnknownTypes(queryTypes),
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
        } satisfies CodegenGenerateTypesWorkerMessage)
      }
    }

    if (fileQueryTypes.length > 0) {
      $info(`Generated types for ${fileQueryTypes.length} queries in "${result.filename}"\n`)
      parentPort?.postMessage({
        type: 'types',
        types: fileQueryTypes,
        filename: result.filename,
      } satisfies CodegenGenerateTypesWorkerMessage)
    }
  }

  parentPort?.postMessage({
    type: 'complete',
  } satisfies CodegenGenerateTypesWorkerMessage)
}

function countUnknownTypes(typeNode: TypeNode): number {
  switch (typeNode.type) {
    case 'unknown':
      return 1
    case 'array':
      return countUnknownTypes(typeNode.of)
    case 'object':
      // if the rest is unknown, we count it as one unknown type
      if (typeNode.rest && typeNode.rest.type === 'unknown') {
        return 1
      }

      return (
        Object.values(typeNode.attributes).reduce(
          (acc, attribute) => acc + countUnknownTypes(attribute.value),
          0,
        ) + (typeNode.rest ? countUnknownTypes(typeNode.rest) : 0)
      )
    case 'union':
      return typeNode.of.reduce((acc, type) => acc + countUnknownTypes(type), 0)

    default:
      return 0
  }
}

main()
