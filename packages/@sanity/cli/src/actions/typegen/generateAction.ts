import {constants, mkdir, open, stat} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {Worker} from 'node:worker_threads'

import {readConfig} from '@sanity/codegen'
import prettier from 'prettier'

import {type CliCommandArguments, type CliCommandContext} from '../../types'
import {getCliWorkerPath} from '../../util/cliWorker'
import {
  type TypegenGenerateTypesWorkerData,
  type TypegenGenerateTypesWorkerMessage,
} from '../../workers/typegenGenerate'
import {TypesGeneratedTrace} from './generate.telemetry'

export interface TypegenGenerateTypesCommandFlags {
  'config-path'?: string
}

const generatedFileWarning = `/**
 * ---------------------------------------------------------------------------------
 * This file has been generated by Sanity TypeGen.
 * Command: \`sanity typegen generate\`
 *
 * Any modifications made directly to this file will be overwritten the next time
 * the TypeScript definitions are generated. Please make changes to the Sanity
 * schema definitions and/or GROQ queries if you need to update these types.
 *
 * For more information on how to use Sanity TypeGen, visit the official documentation:
 * https://www.sanity.io/docs/sanity-typegen
 * ---------------------------------------------------------------------------------
 */\n\n`

export default async function typegenGenerateAction(
  args: CliCommandArguments<TypegenGenerateTypesCommandFlags>,
  context: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const {output, workDir, telemetry} = context

  const trace = telemetry.trace(TypesGeneratedTrace)
  trace.start()

  const codegenConfig = await readConfig(flags['config-path'] || 'sanity-typegen.json')

  try {
    const schemaStats = await stat(codegenConfig.schema)
    if (!schemaStats.isFile()) {
      throw new Error(`Schema path is not a file: ${codegenConfig.schema}`)
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // If the user has not provided a specific schema path (eg we're using the default), give some help
      const hint =
        codegenConfig.schema === './schema.json' ? ` - did you run "sanity schema extract"?` : ''
      throw new Error(`Schema file not found: ${codegenConfig.schema}${hint}`)
    }
    throw err
  }

  const outputPath = join(process.cwd(), codegenConfig.generates)
  const outputDir = dirname(outputPath)
  await mkdir(outputDir, {recursive: true})

  const prettierConfig = codegenConfig.formatGeneratedCode
    ? await prettier.resolveConfig(outputPath).catch((err) => {
        output.warn(`Failed to load prettier config: ${err.message}`)
        return null
      })
    : null
  const workerPath = await getCliWorkerPath('typegenGenerate')

  const spinner = output.spinner({}).start('Generating types')

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      schemaPath: codegenConfig.schema,
      searchPath: codegenConfig.path,
      prettierConfig,
    } satisfies TypegenGenerateTypesWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  const typeFile = await open(
    outputPath,
    // eslint-disable-next-line no-bitwise
    constants.O_TRUNC | constants.O_CREAT | constants.O_WRONLY,
  )

  typeFile.write(generatedFileWarning)

  const stats = {
    queryFilesCount: 0,
    errors: 0,
    queriesCount: 0,
    schemaTypesCount: 0,
    unknownTypeNodesGenerated: 0,
    typeNodesGenerated: 0,
    emptyUnionTypeNodesGenerated: 0,
    size: 0,
  }

  await new Promise<void>((resolve, reject) => {
    worker.addListener('message', (msg: TypegenGenerateTypesWorkerMessage) => {
      if (msg.type === 'error') {
        if (msg.fatal) {
          trace.error(msg.error)
          reject(msg.error)
          return
        }
        const errorMessage = msg.filename
          ? `${msg.error.message} in "${msg.filename}"`
          : msg.error.message
        spinner.fail(errorMessage)
        stats.errors++
        return
      }
      if (msg.type === 'complete') {
        resolve()
        return
      }

      let fileTypeString = `// Source: ${msg.filename}\n`

      if (msg.type === 'schema') {
        stats.schemaTypesCount += msg.length
        fileTypeString += msg.schema
        typeFile.write(fileTypeString)
        return
      }

      stats.queryFilesCount++
      for (const {
        queryName,
        query,
        type,
        typeNodesGenerated,
        unknownTypeNodesGenerated,
        emptyUnionTypeNodesGenerated,
      } of msg.types) {
        fileTypeString += `// Variable: ${queryName}\n`
        fileTypeString += `// Query: ${query.replace(/(\r\n|\n|\r)/gm, '')}\n`
        fileTypeString += type
        stats.queriesCount++
        stats.typeNodesGenerated += typeNodesGenerated
        stats.unknownTypeNodesGenerated += unknownTypeNodesGenerated
        stats.emptyUnionTypeNodesGenerated += emptyUnionTypeNodesGenerated
      }
      typeFile.write(fileTypeString)
      stats.size += Buffer.byteLength(fileTypeString)
    })
    worker.addListener('error', reject)
  })

  typeFile.close()

  trace.log({
    outputSize: stats.size,
    queriesCount: stats.queriesCount,
    schemaTypesCount: stats.schemaTypesCount,
    queryFilesCount: stats.queryFilesCount,
    filesWithErrors: stats.errors,
    typeNodesGenerated: stats.typeNodesGenerated,
    unknownTypeNodesGenerated: stats.unknownTypeNodesGenerated,
    unknownTypeNodesRatio:
      stats.typeNodesGenerated > 0 ? stats.unknownTypeNodesGenerated / stats.typeNodesGenerated : 0,
    emptyUnionTypeNodesGenerated: stats.emptyUnionTypeNodesGenerated,
  })

  trace.complete()
  if (stats.errors > 0) {
    spinner.warn(`Encountered errors in ${stats.errors} files while generating types`)
  }

  spinner.succeed(
    `Generated TypeScript types for ${stats.schemaTypesCount} schema types and ${stats.queriesCount} GROQ queries in ${stats.queryFilesCount} files into: ${codegenConfig.generates}`,
  )
}
