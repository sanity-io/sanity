import path from 'path'
import {isPlainObject} from 'lodash'
import {mockBrowserEnvironment} from '../../util/mockBrowserEnvironment'

const schemaPath = process.argv[2] as string

const cleanup = mockBrowserEnvironment(path.dirname(schemaPath))

// eslint-disable-next-line import/no-dynamic-require
const mod = require(schemaPath)
const schema = mod.__esModule && mod.default ? mod.default : mod

// We're communicating with a parent process through a message channel
try {
  const types = getStrippedSchemaTypes(schema)
  if (process.send) {
    process.send({type: 'types', types})
  } else {
    process.stdout.write(JSON.stringify(types, null, 2))
  }
} catch (error) {
  if (process.send) {
    process.send({
      type: 'error',
      error: error instanceof Error ? error.stack : error,
      errorType: error && (error.type || error.name),
    })
  } else {
    throw error
  }
}

cleanup()

interface SchemaDefinitionish {
  name: string
  type: string
  fields?: SchemaDefinitionish[]
}

interface SchemaConfig {
  name: string
  types: SchemaDefinitionish[]
}

type SchemaInput = SchemaConfig | SchemaDefinitionish[]

function getStrippedSchemaTypes(schemaDef: SchemaInput): SchemaDefinitionish[] {
  if (isSchemaConfig(schemaDef)) {
    return schemaDef.types.map((type) => stripType(type))
  }

  if (isSchemaDefinitionishArray(schemaDef)) {
    return schemaDef.map((type) => stripType(type))
  }

  throw new Error(
    'Unrecognized schema module shape - should be either an array of schema types, or an object with `name` and `types` properties'
  )
}

function isSchemaConfig(input: SchemaInput): input is SchemaConfig {
  return (
    Boolean(input) &&
    typeof input === 'object' &&
    'name' in input &&
    'types' in input &&
    typeof input.name === 'string' &&
    Array.isArray(input.types)
  )
}

function isSchemaDefinitionishArray(input: SchemaInput): input is SchemaDefinitionish[] {
  return Array.isArray(input) && input.every(isSchemaDefinitionish)
}

function isSchemaDefinitionish(input: unknown): input is SchemaDefinitionish {
  const hasCorrectProps = Boolean(
    input &&
      typeof input === 'object' &&
      !Array.isArray(input) &&
      'name' in input &&
      'type' in input
  )

  if (!hasCorrectProps) {
    return false
  }

  const schemaDef = input as SchemaDefinitionish
  return typeof schemaDef.name === 'string' && typeof schemaDef.type === 'string'
}

function isBasicType(input: unknown): boolean {
  const type = typeof input
  if (type === 'boolean' || type === 'number' || type === 'string') {
    return true
  }

  if (type !== 'object') {
    return false
  }

  return Array.isArray(input) || input === null || isPlainishObject(input)
}

function stripType(input: unknown): SchemaDefinitionish {
  return strip(input) as SchemaDefinitionish
}

function strip(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => strip(item)).filter((item) => typeof item !== 'undefined')
  }

  if (isPlainishObject(input)) {
    return Object.keys(input).reduce((stripped, key) => {
      stripped[key] = strip(input[key])
      return stripped
    }, {} as Record<string, unknown>)
  }

  return isBasicType(input) ? input : undefined
}

function isPlainishObject(input: unknown): input is Record<string, unknown> {
  return isPlainObject(input)
}
