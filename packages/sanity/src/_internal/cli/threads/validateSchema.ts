import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {
  type EncodableObject,
  type EncodableValue,
  type SetSynchronization,
} from '@sanity/descriptors'
import {DescriptorConverter} from '@sanity/schema/_internal'
import {type SchemaValidationProblem, type SchemaValidationProblemGroup} from '@sanity/types'

import {getStudioWorkspaces} from '../util/getStudioWorkspaces'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'

/** @internal */
export interface ValidateSchemaWorkerData {
  workDir: string
  workspace?: string
  level?: SchemaValidationProblem['severity']
  debugSerialize?: boolean
}

/** @internal */
export interface ValidateSchemaWorkerResult {
  validation: SchemaValidationProblemGroup[]
  serializedDebug?: SeralizedSchemaDebug
}

/**
 * Contains debug information about the serialized schema.
 *
 * @internal
 **/
export type SeralizedSchemaDebug = {
  size: number
  parent?: SeralizedSchemaDebug
  types: Record<string, SerializedTypeDebug>
}

/**
 * Contains debug information about a serialized type.
 *
 * @internal
 **/
export type SerializedTypeDebug = {
  size: number
  extends: string
  fields?: Record<string, SerializedTypeDebug>
  of?: Record<string, SerializedTypeDebug>
}

const {
  workDir,
  workspace: workspaceName,
  level = 'warning',
  debugSerialize,
} = _workerData as ValidateSchemaWorkerData

async function main() {
  if (isMainThread || !parentPort) {
    throw new Error('This module must be run as a worker thread')
  }

  const cleanup = mockBrowserEnvironment(workDir)

  try {
    const workspaces = await getStudioWorkspaces({basePath: workDir})

    if (!workspaces.length) {
      throw new Error(`Configuration did not return any workspaces.`)
    }

    let workspace
    if (workspaceName) {
      workspace = workspaces.find((w) => w.name === workspaceName)
      if (!workspace) {
        throw new Error(`Could not find any workspaces with name \`${workspaceName}\``)
      }
    } else {
      if (workspaces.length !== 1) {
        throw new Error(
          "Multiple workspaces found. Please specify which workspace to use with '--workspace'.",
        )
      }
      workspace = workspaces[0]
    }

    const schema = workspace.schema
    const validation = schema._validation!

    let serializedDebug: ValidateSchemaWorkerResult['serializedDebug']

    if (debugSerialize) {
      const conv = new DescriptorConverter({})
      const set = conv.get(schema)
      serializedDebug = getSeralizedSchemaDebug(set)
    }

    const result: ValidateSchemaWorkerResult = {
      validation: validation
        .map((group) => ({
          ...group,
          problems: group.problems.filter((problem) =>
            level === 'error' ? problem.severity === 'error' : true,
          ),
        }))
        .filter((group) => group.problems.length),
      serializedDebug,
    }

    parentPort?.postMessage(result)
  } catch (err) {
    console.error(err)
    console.error(err.stack)
    throw err
  } finally {
    cleanup()
  }
}

function getSeralizedSchemaDebug(set: SetSynchronization<string>): SeralizedSchemaDebug {
  let size = 0
  const types: Record<string, SerializedTypeDebug> = {}

  for (const [id, value] of Object.entries(set.objectValues)) {
    const typeName = typeof value.name === 'string' ? value.name : id
    if (isEncodableObject(value.typeDef)) {
      const debug = getSerializedTypeDebug(value.typeDef)
      types[typeName] = debug
      size += debug.size
    }
  }

  return {
    size,
    types,
  }
}

function isEncodableObject(val: EncodableValue | undefined): val is EncodableObject {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

function getSerializedTypeDebug(typeDef: EncodableObject): SerializedTypeDebug {
  const ext = typeof typeDef.extends === 'string' ? typeDef.extends : '<unknown>'
  let fields: SerializedTypeDebug['fields']
  let of: SerializedTypeDebug['of']

  if (Array.isArray(typeDef.fields)) {
    fields = {}

    for (const field of typeDef.fields) {
      if (!isEncodableObject(field)) continue
      const name = field.name
      const fieldTypeDef = field.typeDef
      if (typeof name !== 'string' || !isEncodableObject(fieldTypeDef)) continue

      fields[name] = getSerializedTypeDebug(fieldTypeDef)
    }
  }

  if (Array.isArray(typeDef.of)) {
    of = {}

    for (const field of typeDef.of) {
      if (!isEncodableObject(field)) continue
      const name = field.name
      const arrayTypeDef = field.typeDef
      if (typeof name !== 'string' || !isEncodableObject(arrayTypeDef)) continue

      of[name] = getSerializedTypeDebug(arrayTypeDef)
    }
  }

  return {
    size: JSON.stringify(typeDef).length,
    extends: ext,
    fields,
    of,
  }
}

void main().then(() => process.exit())
