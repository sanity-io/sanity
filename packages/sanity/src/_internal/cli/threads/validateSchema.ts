import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {groupProblems, validateSchema} from '@sanity/schema/_internal'
import {type SchemaValidationProblem, type SchemaValidationProblemGroup} from '@sanity/types'
import {resolveSchemaTypes} from 'sanity'

import {getStudioConfig} from '../util/getStudioWorkspaces'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'

/** @internal */
export interface ValidateSchemaWorkerData {
  workDir: string
  workspace?: string
  level?: SchemaValidationProblem['severity']
}

/** @internal */
export interface ValidateSchemaWorkerResult {
  validation: SchemaValidationProblemGroup[]
}

const {
  workDir,
  workspace: workspaceName,
  level = 'warning',
} = _workerData as ValidateSchemaWorkerData

async function main() {
  if (isMainThread || !parentPort) {
    throw new Error('This module must be run as a worker thread')
  }

  const cleanup = mockBrowserEnvironment(workDir)

  try {
    const workspaces = getStudioConfig({basePath: workDir})

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

    const schemaTypes = resolveSchemaTypes({
      config: workspace,
      context: {dataset: workspace.dataset, projectId: workspace.projectId},
    })

    const validation = groupProblems(validateSchema(schemaTypes).getTypes())

    const result: ValidateSchemaWorkerResult = {
      validation: validation
        .map((group) => ({
          ...group,
          problems: group.problems.filter((problem) =>
            level === 'error' ? problem.severity === 'error' : true,
          ),
        }))
        .filter((group) => group.problems.length),
    }

    parentPort?.postMessage(result)
  } finally {
    cleanup()
  }
}

main().then(() => process.exit())
