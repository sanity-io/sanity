import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {extractSchema} from '@sanity/schema/_internal'
import {type SchemaType} from 'groq-js'
import {
  ConcreteRuleClass,
  type SchemaTypeDefinition,
  type SchemaValidationValue,
  type Workspace,
} from 'sanity'

import {getStudioWorkspaces} from '../util/getStudioWorkspaces'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'

const formats = ['direct', 'groq-type-nodes'] as const
type Format = (typeof formats)[number]

/** @internal */
export interface ExtractSchemaWorkerData {
  workDir: string
  workspaceName?: string
  enforceRequiredFields?: boolean
  format: Format | string
}

type WorkspaceTransformer = (workspace: Workspace) => ExtractSchemaWorkerResult

const workspaceTransformers: Record<Format, WorkspaceTransformer> = {
  'direct': (workspace) => {
    return {
      name: workspace.name,
      dataset: workspace.dataset,
      schema: JSON.parse(
        JSON.stringify(workspace.schema._original, (key, value) => {
          if (key === 'validation' && isSchemaValidationValue(value)) {
            return serializeValidation(value)
          }
          return value
        }),
      ),
    }
  },
  'groq-type-nodes': (workspace) => ({
    schema: extractSchema(workspace.schema, {
      enforceRequiredFields: opts.enforceRequiredFields,
    }),
  }),
}

/** @internal */
export type ExtractSchemaWorkerResult<TargetFormat extends Format = Format> = {
  'direct': Pick<Workspace, 'name' | 'dataset'> & {schema: SchemaTypeDefinition[]}
  'groq-type-nodes': {schema: SchemaType}
}[TargetFormat]

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const opts = _workerData as ExtractSchemaWorkerData
const {format} = opts
const cleanup = mockBrowserEnvironment(opts.workDir)

async function main() {
  try {
    if (!isFormat(format)) {
      throw new Error(`Unsupported format: "${format}"`)
    }

    const workspaces = await getStudioWorkspaces({basePath: opts.workDir})

    const postWorkspace = (workspace: Workspace): void => {
      const transformer = workspaceTransformers[format]
      parentPort?.postMessage(transformer(workspace))
    }

    if (opts.workspaceName) {
      const workspace = getWorkspace({workspaces, workspaceName: opts.workspaceName})
      postWorkspace(workspace)
    } else {
      for (const workspace of workspaces) {
        postWorkspace(workspace)
      }
    }
  } finally {
    parentPort?.close()
    cleanup()
  }
}

main()

function getWorkspace({
  workspaces,
  workspaceName,
}: {
  workspaces: Workspace[]
  workspaceName?: string
}): Workspace {
  if (workspaces.length === 0) {
    throw new Error('No studio configuration found')
  }

  if (workspaces.length === 1) {
    return workspaces[0]
  }

  const workspace = workspaces.find((w) => w.name === workspaceName)
  if (!workspace) {
    throw new Error(`Could not find workspace "${workspaceName}"`)
  }
  return workspace
}

function isFormat(maybeFormat: string): maybeFormat is Format {
  return formats.includes(maybeFormat as Format)
}

// TODO: Simplify output format.
function serializeValidation(validation: SchemaValidationValue): SchemaValidationValue[] {
  const validationArray = Array.isArray(validation) ? validation : [validation]

  return validationArray
    .reduce<SchemaValidationValue[]>((output, validationValue) => {
      if (typeof validationValue === 'function') {
        const rule = new ConcreteRuleClass()
        const applied = validationValue(rule)

        // TODO: Deduplicate by flag.
        // TODO: Handle merging of validation rules for array items.
        return [...output, applied]
      }
      return output
    }, [])
    .flat()
}

function isSchemaValidationValue(
  maybeSchemaValidationValue: unknown,
): maybeSchemaValidationValue is SchemaValidationValue {
  if (Array.isArray(maybeSchemaValidationValue)) {
    return maybeSchemaValidationValue.every(isSchemaValidationValue)
  }

  // TODO: Errors with `fields() can only be called on an object type` when it encounters
  // the `fields` validation rule on a type that is not directly an `object`. This mayb be
  // because the validation rules aren't normalized.
  try {
    return (
      maybeSchemaValidationValue === false ||
      typeof maybeSchemaValidationValue === 'undefined' ||
      maybeSchemaValidationValue instanceof ConcreteRuleClass ||
      (typeof maybeSchemaValidationValue === 'function' &&
        isSchemaValidationValue(maybeSchemaValidationValue(new ConcreteRuleClass())))
    )
  } catch (error) {
    const hasMessage = 'message' in error

    if (!hasMessage || error.message !== 'fields() can only be called on an object type') {
      throw error
    }
  }

  return false
}
