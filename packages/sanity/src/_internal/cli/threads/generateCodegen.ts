import {
  type CodegenConfig,
  findQueriesInPath,
  getResolver,
  readSchema,
  registerBabel,
  TypeGenerator,
} from '@sanity/codegen'
import debug from 'debug'
import {parse, typeEvaluate} from 'groq-js'
import {map} from 'rxjs/operators'
import {isMainThread, parentPort, workerData as _workerData} from 'worker_threads'

const $info = debug('sanity:codegen:generate:info')

export interface CodegenGenerateWorkerData {
  workDir: string
  workspaceName?: string
  config: CodegenConfig
}

export type CodegenGenerateWorkerMessage =
  | {
      error: Error
      fatal: boolean
      query?: string
    }
  | {
      filename: string
      types:
        | string
        | {
            queryName: string
            query: string
            type: string
          }[]
    }
  | {
      complete: true
    }

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const opts = _workerData as CodegenGenerateWorkerData

registerBabel()

async function main() {
  try {
    const schema = await readSchema(opts.config.schema)

    const typeGenerator = new TypeGenerator(schema)
    const schemaTypes = typeGenerator.generateTypesFromSchema()
    const resolver = await getResolver()

    parentPort?.postMessage({
      types: schemaTypes,
      filename: 'schema.json',
    } satisfies CodegenGenerateWorkerMessage)

    return findQueriesInPath({
      path: opts.config.path,
      resolver,
    })
      .pipe(
        map((findResult) => {
          if (findResult.error) {
            parentPort?.postMessage({
              error: findResult.error,
              fatal: false,
            } satisfies CodegenGenerateWorkerMessage)
            return {filename: findResult.filename, result: []}
          }

          const queries = [...findResult.queries.values()]
          if (queries.length === 0) {
            return {filename: findResult.filename, result: []}
          }
          $info(`Processing ${queries.length} queries in "${findResult.filename}"...`)

          const result: {queryName: string; query: string; type: string}[] = []
          for (const {name: queryName, result: query} of queries) {
            try {
              const ast = parse(query)
              const queryTypes = typeEvaluate(ast, schema)

              const type = typeGenerator.generateTypeForField(queryName, queryTypes)

              result.push({queryName, query, type})
            } catch (err) {
              parentPort?.postMessage({
                error: new Error(
                  `Error generating types for query "${queryName}" in "${findResult.filename}": ${err.message}`,
                  {cause: err},
                ),
                fatal: false,
                query,
              } satisfies CodegenGenerateWorkerMessage)
            }
          }

          return {filename: findResult.filename, result}
        }),
      )
      .subscribe({
        next: (result) => {
          if (result.result.length > 0) {
            $info(`Generated types for ${result.result.length} queries in "${result.filename}"\n`)
            parentPort?.postMessage({
              types: result.result,
              filename: result.filename,
            } satisfies CodegenGenerateWorkerMessage)
          }
        },
        error: (err) => {
          parentPort?.postMessage({
            error: new Error(`Error generating types: ${err.message}`, {cause: err}),
            fatal: true,
          } satisfies CodegenGenerateWorkerMessage)
        },
        complete: () => {
          parentPort?.postMessage({
            complete: true,
          } satisfies CodegenGenerateWorkerMessage)
        },
      })
  } finally {
    // nothing
  }
}

main()
