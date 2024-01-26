import path from 'path'
import {Worker} from 'worker_threads'
import readPkgUp from 'read-pkg-up'
import {ClientConfig} from '@sanity/client'
import {ValidationMarker} from '@sanity/types'
import type {
  ValidateDocumentsWorkerData,
  ValidationWorkerChannel,
} from '../../threads/validateDocuments'
import {createReceiver, WorkerChannelReceiver} from '../../util/workerChannels'

const DEFAULT_MAX_CUSTOM_VALIDATION_CONCURRENCY = 5

export interface ValidateDocumentsOptions<TReturn = unknown> {
  level?: 'error' | 'warning' | 'info'
  workspace?: string
  workDir?: string
  configPath?: string
  clientConfig?: Partial<ClientConfig>
  projectId?: string // override
  dataset?: string // override
  ndjsonFilePath?: string
  maxCustomValidationConcurrency?: number
  reporter?: (worker: WorkerChannelReceiver<ValidationWorkerChannel>) => TReturn
}

export interface DocumentValidationResult {
  documentId: string
  documentType: string
  revision: string
  level: ValidationMarker['level']
  markers: ValidationMarker[]
}

const defaultReporter = ({stream, dispose}: WorkerChannelReceiver<ValidationWorkerChannel>) => {
  async function* createValidationGenerator() {
    for await (const {documentId, documentType, markers, revision, level} of stream.validation()) {
      const result: DocumentValidationResult = {
        documentId,
        documentType,
        revision,
        level,
        markers,
      }

      yield result
    }

    await dispose()
  }

  return createValidationGenerator()
}

export function validateDocuments<TReturn>(
  options: ValidateDocumentsOptions<TReturn> &
    Required<Pick<ValidateDocumentsOptions<TReturn>, 'reporter'>>,
): TReturn
export function validateDocuments(
  options: ValidateDocumentsOptions,
): AsyncIterable<DocumentValidationResult>
export function validateDocuments(options: ValidateDocumentsOptions): unknown {
  const {
    workspace,
    clientConfig,
    configPath,
    dataset,
    projectId,
    workDir = process.cwd(),
    reporter = defaultReporter,
    level,
    maxCustomValidationConcurrency,
    ndjsonFilePath,
  } = options

  const rootPkgPath = readPkgUp.sync({cwd: __dirname})?.path
  if (!rootPkgPath) {
    throw new Error('Could not find root directory for `sanity` package')
  }

  const workerPath = path.join(
    path.dirname(rootPkgPath),
    'lib',
    '_internal',
    'cli',
    'threads',
    'validateDocuments.js',
  )

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      // removes props in the config that make this object fail to serialize
      clientConfig: JSON.parse(JSON.stringify(clientConfig)),
      configPath,
      workspace,
      dataset,
      projectId,
      level,
      ndjsonFilePath,
      maxCustomValidationConcurrency:
        maxCustomValidationConcurrency ?? DEFAULT_MAX_CUSTOM_VALIDATION_CONCURRENCY,
    } satisfies ValidateDocumentsWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  return reporter(createReceiver<ValidationWorkerChannel>(worker))
}
