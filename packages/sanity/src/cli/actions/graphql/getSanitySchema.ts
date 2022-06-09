/**
 * Attempts to read the schema file at the given path, and return a compiled schema
 */
import path from 'path'
import {fork, Serializable} from 'child_process'
import type {SchemaTypeDefinition, Schema} from '@sanity/types'
import {createSchema} from '../../../schema'

type ExpectedResult = TypesResult | ErrorResult

interface TypesResult {
  type: 'types'
  types: SchemaTypeDefinition[]
}

interface ErrorResult {
  type: 'error'
  error: string
  errorType: string
}

export async function getSanitySchema(schemaPath: string): Promise<Schema> {
  const types = await getSanitySchemaTypes(schemaPath)
  const schema = createSchema({name: 'default', types})
  return schema
}

function isExpectedResultShape(message: Serializable): message is ExpectedResult {
  return (
    typeof message === 'object' && message !== null && !Array.isArray(message) && 'type' in message
  )
}

function isTypesResult(message: ExpectedResult): message is TypesResult {
  return isExpectedResultShape(message) && message.type === 'types'
}

function getSanitySchemaTypes(schemaPath: string): Promise<SchemaTypeDefinition[]> {
  return new Promise((resolve, reject) => {
    const childPath = path.join(__dirname, 'getSanitySchema.fork.js')
    const childProc = fork(childPath, [schemaPath], {})

    childProc.on('message', (message) => {
      if (!isExpectedResultShape(message)) {
        reject(new Error('Unexpected result shape from schema fork'))
        return
      }

      if (isTypesResult(message)) {
        resolve(message.types)
        return
      }

      const error = new Error(message.error)
      ;(error as any).type = message.errorType
      reject(new Error(`Failed to read schema at "${schemaPath}": ${message.error}`))
    })

    childProc.on('error', (err) => {
      reject(new Error(`Failed to read schema at "${schemaPath}":\n\n${err.stack}`))
    })

    childProc.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`childProc stopped with exit code ${code}`))
      }
    })
  })
}
