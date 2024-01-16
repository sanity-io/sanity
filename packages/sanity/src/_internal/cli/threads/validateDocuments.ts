import {isMainThread, parentPort, workerData as _workerData} from 'worker_threads'
import readline from 'readline'
import {Readable} from 'stream'
import os from 'os'
import fs from 'fs'
import path from 'path'
import {
  type ClientConfig,
  type SanityClient,
  type SanityDocument,
  createClient,
} from '@sanity/client'
import {type ValidationContext, type ValidationMarker, isReference} from '@sanity/types'
import {getStudioConfig} from '../util/getStudioConfig'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'
import {
  createReporter,
  type WorkerChannel,
  type WorkerChannelEvent,
  type WorkerChannelStream,
} from '../util/workerChannels'
import {isRecord, validateDocument} from 'sanity'

const MAX_VALIDATION_CONCURRENCY = 100
const DOCUMENT_VALIDATION_TIMEOUT = 30000
const REFERENCE_INTEGRITY_BATCH_SIZE = 100

interface AvailabilityResponse {
  omitted: {id: string; reason: 'existence' | 'permission'}[]
}

export interface ValidateDocumentsWorkerData {
  workDir: string
  configPath?: string
  workspace?: string
  clientConfig?: Partial<ClientConfig>
  projectId?: string
  dataset?: string
  level?: ValidationMarker['level']
  maxCustomValidationConcurrency?: number
}

export type ValidationWorkerChannel = WorkerChannel<{
  loadedWorkspace: WorkerChannelEvent<{
    name: string
    projectId: string
    dataset: string
    studioHost: string | null
    basePath: string
  }>
  loadedDocumentCount: WorkerChannelEvent<{documentCount: number}>
  exportProgress: WorkerChannelStream<{downloadedCount: number; documentCount: number}>
  loadedReferenceIntegrity: WorkerChannelEvent
  validation: WorkerChannelStream<{
    validatedCount: number
    documentId: string
    documentType: string
    revision: string
    level: ValidationMarker['level']
    markers: ValidationMarker[]
  }>
}>

const {
  clientConfig,
  workDir,
  workspace: workspaceName,
  configPath,
  dataset,
  projectId,
  level,
  maxCustomValidationConcurrency,
} = _workerData as ValidateDocumentsWorkerData

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const levelValues = {error: 0, warning: 1, info: 2} as const

const report = createReporter<ValidationWorkerChannel>(parentPort)

const getReferenceIds = (value: unknown) => {
  const ids = new Set<string>()

  function traverse(node: unknown) {
    if (isReference(node)) {
      ids.add(node._ref)
      return
    }

    if (typeof node === 'object' && node) {
      // Note: this works for arrays too
      for (const item of Object.values(node)) {
        traverse(item)
      }
    }
  }

  traverse(value)

  return ids
}

const idRegex = /^[^-][A-Z0-9._-]*$/i

// during testing, the `doc` endpoint 502'ed if given an invalid ID
const isValidId = (id: unknown) => typeof id === 'string' && idRegex.test(id)

async function* readerGenerator(reader: ReadableStreamDefaultReader<Uint8Array>) {
  while (true) {
    const {value, done} = await reader.read()
    if (value) yield value
    if (done) return
  }
}

validateDocuments()

async function loadWorkspace() {
  const workspaces = await getStudioConfig({basePath: workDir, configPath})

  if (!workspaces.length) {
    throw new Error(`Configuration did not return any workspaces.`)
  }

  let _workspace
  if (workspaceName) {
    _workspace = workspaces.find((w) => w.name === workspaceName)
    if (!_workspace) {
      throw new Error(`Could not find any workspaces with name \`${workspaceName}\``)
    }
  } else {
    if (workspaces.length !== 1) {
      throw new Error(
        "Multiple workspaces found. Please specify which workspace to use with '--workspace'.",
      )
    }
    _workspace = workspaces[0]
  }
  const workspace = _workspace

  const client = createClient({
    ...clientConfig,
    dataset: dataset || workspace.dataset,
    projectId: projectId || workspace.projectId,
    // we set this explictly to true because the default client configuration
    // from the CLI comes configured with `useProjectHostname: false` when
    // `requireProject` is set to false
    useProjectHostname: true,
    // we set this explictly to true because we pass in a token via the
    // `clientConfiguration` object and also mock a browser environment in
    // this worker which triggers the browser warning
    ignoreBrowserTokenWarning: true,
    requestTagPrefix: 'sanity.cli.validate',
  }).config({apiVersion: 'v2021-03-25'})

  let studioHost
  try {
    const project = await client.projects.getById(projectId || workspace.projectId)
    studioHost = project.metadata.externalStudioHost || project.studioHost
  } catch {
    // no big deal if we fail to get the studio host
    studioHost = null
  }

  report.event.loadedWorkspace({
    projectId: workspace.projectId,
    dataset: workspace.dataset,
    name: workspace.name,
    studioHost,
    basePath: workspace.basePath,
  })

  return {workspace, client}
}

async function downloadDocuments(client: SanityClient) {
  const exportUrl = new URL(client.getUrl(`/data/export/${client.config().dataset}`, false))

  const documentCount = await client.fetch('length(*)')
  report.event.loadedDocumentCount({documentCount})

  const {token} = client.config()
  const response = await fetch(exportUrl, {
    headers: new Headers({
      ...(token && {Authorization: `Bearer ${token}`}),
    }),
  })

  const reader = response.body?.getReader()
  if (!reader) throw new Error('Could not get reader from response body.')

  const lines = readline.createInterface({input: Readable.from(readerGenerator(reader))})

  let downloadedCount = 0
  const referencedIds = new Set<string>()
  const documentIds = new Set<string>()

  // Note: we stream the export to a file and then re-read from that file to
  // make this less memory intensive.
  // this is a similar pattern to the import/export CLI commands
  const slugDate = new Date()
    .toISOString()
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
  const tempOutputFile = path.join(os.tmpdir(), `sanity-validate-${slugDate}.ndjson`)
  const outputStream = fs.createWriteStream(tempOutputFile)

  for await (const line of lines) {
    const document = JSON.parse(line) as SanityDocument
    documentIds.add(document._id)
    for (const referenceId of getReferenceIds(document)) {
      referencedIds.add(referenceId)
    }

    outputStream.write(`${line}\n`)

    downloadedCount++
    report.stream.exportProgress.emit({downloadedCount, documentCount})
  }

  await new Promise<void>((resolve, reject) =>
    outputStream.close((err) => (err ? reject(err) : resolve())),
  )

  async function* getDocuments() {
    const rl = readline.createInterface({input: fs.createReadStream(tempOutputFile)})
    for await (const line of rl) {
      if (line) {
        yield JSON.parse(line) as SanityDocument
      }
    }

    rl.close()
  }

  report.stream.exportProgress.end()

  return {getDocuments, documentIds, referencedIds, tempOutputFile}
}

interface CheckReferenceExistenceOptions {
  client: SanityClient
  referencedIds: Set<string>
  documentIds: Set<string>
}

async function checkReferenceExistence({
  client,
  documentIds,
  referencedIds: _referencedIds,
}: CheckReferenceExistenceOptions) {
  const existingIds = new Set(documentIds)
  const idsToCheck = Array.from(_referencedIds)
    .filter((id) => !existingIds.has(id) && isValidId(id))
    .sort()

  const batches = idsToCheck.reduce<string[][]>(
    (acc, next, index) => {
      const batchIndex = Math.floor(index / REFERENCE_INTEGRITY_BATCH_SIZE)
      const batch = acc[batchIndex]
      batch.push(next)
      return acc
    },
    Array.from<string[]>({
      length: Math.ceil(idsToCheck.length / REFERENCE_INTEGRITY_BATCH_SIZE),
    }).fill([]),
  )

  for (const batch of batches) {
    const {omitted} = await client.request<AvailabilityResponse>({
      uri: client.getDataUrl('doc', batch.join(',')),
      json: true,
      query: {excludeContent: 'true'},
      tag: 'documents-availability',
    })

    const omittedIds = omitted.reduce<Record<string, 'existence' | 'permission'>>((acc, next) => {
      acc[next.id] = next.reason
      return acc
    }, {})

    for (const id of batch) {
      // unless the document ID is in the `omitted` object explictly due to
      // the reason `'existence'`, then it should exist
      if (omittedIds[id] !== 'existence') {
        existingIds.add(id)
      }
    }
  }
  report.event.loadedReferenceIntegrity()

  return {existingIds}
}

async function validateDocuments() {
  // note: this is dynamically imported because this module is ESM only and this
  // file gets compiled to CJS at this time
  const {default: pMap} = await import('p-map')

  const cleanup = mockBrowserEnvironment(workDir)

  let tempFile: string | undefined

  try {
    const {client, workspace} = await loadWorkspace()
    const {getDocuments, documentIds, referencedIds, tempOutputFile} =
      await downloadDocuments(client)
    const {existingIds} = await checkReferenceExistence({client, referencedIds, documentIds})
    tempFile = tempOutputFile

    const getClient = <TOptions extends Partial<ClientConfig>>(options: TOptions) =>
      client.withConfig(options)

    const getDocumentExists: ValidationContext['getDocumentExists'] = ({id}) =>
      Promise.resolve(existingIds.has(id))

    const getLevel = (markers: ValidationMarker[]) => {
      let foundWarning = false
      for (const marker of markers) {
        if (marker.level === 'error') return 'error'
        if (marker.level === 'warning') foundWarning = true
      }

      if (foundWarning) return 'warning'
      return 'info'
    }

    let validatedCount = 0

    const validate = async (document: SanityDocument) => {
      let markers: ValidationMarker[]

      try {
        const timeout = Symbol('timeout')

        const result = await Promise.race([
          validateDocument({
            document,
            workspace,
            getClient,
            getDocumentExists,
            environment: 'cli',
            maxCustomValidationConcurrency,
          }),
          new Promise<typeof timeout>((resolve) =>
            setTimeout(() => resolve(timeout), DOCUMENT_VALIDATION_TIMEOUT),
          ),
        ])

        if (result === timeout) {
          throw new Error(
            `Document '${document._id}' failed to validate within ${DOCUMENT_VALIDATION_TIMEOUT}ms.`,
          )
        }

        markers = result
          // remove deprecated `item` from the marker
          .map(({item, ...marker}) => marker)
          // filter out unwanted levels
          .filter((marker) => {
            const markerValue = levelValues[marker.level]
            const flagLevelValue =
              levelValues[level as keyof typeof levelValues] ?? levelValues.info
            return markerValue <= flagLevelValue
          })
      } catch (err) {
        const errorMessage =
          isRecord(err) && typeof err.message === 'string' ? err.message : 'Unknown error'

        const message = `Exception occurred while validating value: ${errorMessage}`

        markers = [
          {
            message,
            level: 'error',
            path: [],
          },
        ]
      }

      validatedCount++

      report.stream.validation.emit({
        documentId: document._id,
        documentType: document._type,
        revision: document.rev,
        markers,
        validatedCount,
        level: getLevel(markers),
      })
    }

    await pMap(getDocuments(), validate, {concurrency: MAX_VALIDATION_CONCURRENCY})

    report.stream.validation.end()
  } finally {
    cleanup()

    // eslint-disable-next-line no-sync
    if (tempFile && fs.existsSync(tempFile)) {
      await fs.promises.rm(tempFile)
    }
  }
}
