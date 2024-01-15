import {isMainThread, parentPort, workerData as _workerData} from 'worker_threads'
import readline from 'readline'
import {Readable} from 'stream'
import {ClientConfig, SanityDocument, createClient} from '@sanity/client'
import {ValidationContext, ValidationMarker} from '@sanity/types'
import {getStudioConfig} from '../util/getStudioConfig'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'
import {
  createReporter,
  WorkerChannel,
  WorkerChannelEvent,
  WorkerChannelStream,
} from '../util/workerChannels'
import {isRecord, validateDocument} from 'sanity'

const MAX_VALIDATION_CONCURRENCY = 100
const DOCUMENT_VALIDATION_TIMEOUT = 30000

export interface ValidateDocumentsWorkerData {
  workDir: string
  configPath?: string
  workspace?: string
  clientConfig?: Partial<ClientConfig>
  projectId?: string
  dataset?: string
  level?: ValidationMarker['level']
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
} = _workerData as ValidateDocumentsWorkerData

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const levelValues = {error: 0, warning: 1, info: 2} as const

const report = createReporter<ValidationWorkerChannel>(parentPort)

async function* readerGenerator(reader: ReadableStreamDefaultReader<Uint8Array>) {
  while (true) {
    const {value, done} = await reader.read()
    if (value) yield value
    if (done) return
  }
}

validateDocuments()

async function validateDocuments() {
  // note: this is dynamically imported because this module is ESM only and this
  // file gets compiled to CJS at this time
  const {default: pMap} = await import('p-map')

  // ===== LOAD WORKSPACE =====
  const workspaces = await getStudioConfig({basePath: workDir, configPath})
  const cleanup = mockBrowserEnvironment(workDir)

  try {
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
      ignoreBrowserTokenWarning: true,
      useProjectHostname: true,
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

    // ===== DOWNLOAD DOCUMENTS =====
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
    const documents = new Map<string, SanityDocument>()

    for await (const line of lines) {
      const document = JSON.parse(line) as SanityDocument
      documents.set(document._id, document)

      downloadedCount++
      report.stream.exportProgress.emit({downloadedCount, documentCount})
    }

    report.stream.exportProgress.end()

    // ===== VALIDATE DOCUMENTS =====
    const getClient = <TOptions extends Partial<ClientConfig>>(options: TOptions) =>
      client.withConfig(options)

    const getDocumentExists: ValidationContext['getDocumentExists'] = ({id}) =>
      Promise.resolve(documents.has(id))

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

    await pMap(documents.values(), validate, {
      concurrency: MAX_VALIDATION_CONCURRENCY,
    })

    report.stream.validation.end()
  } finally {
    cleanup()
  }
}
