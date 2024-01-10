import {isMainThread, parentPort, workerData as _workerData} from 'worker_threads'
import readline from 'readline'
import {Readable} from 'stream'
import {ClientConfig, SanityClient, SanityDocument, createClient} from '@sanity/client'
import {ValidationContext, ValidationMarker} from '@sanity/types'
import {getStudioConfig} from '../util/getStudioConfig'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'
import {
  createReporter,
  WorkerChannel,
  WorkerChannelEvent,
  WorkerChannelStream,
} from '../util/workerChannels'
import {Workspace, createSchema, isRecord, validateDocument} from 'sanity'

const MAX_VALIDATION_CONCURRENCY = 100
const DOCUMENT_VALIDATION_TIMEOUT = 30000

export interface ValidateDocumentsWorkerData {
  workDir: string
  configPath?: string
  workspace?: string
  clientConfig?: Partial<ClientConfig>
  projectId?: string
  dataset?: string
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
} = _workerData as ValidateDocumentsWorkerData

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const report = createReporter<ValidationWorkerChannel>(parentPort)

validateDocuments()

async function validateDocuments() {
  // note: this is dynamically imported because this module is ESM only and this
  // file gets compiled to CJS at this time
  const {default: pMap} = await import('p-map')

  const workspaces = await getStudioConfig({basePath: workDir, configPath})
  const cleanup = mockBrowserEnvironment(workDir)

  try {
    const workspace =
      workspaces.find((w) => w.name === workspaceName) || (workspaces.length === 1 && workspaces[0])

    if (!workspace) {
      if (workspaceName) {
        throw new Error(`Could not find any workspaces with name \`${workspaceName}\``)
      }
      throw new Error(`Could not find a workspace to validate documents`)
    }

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

    const documents = await getDocuments(workspace, client)

    const getClient = <TOptions extends Partial<ClientConfig>>(options: TOptions) =>
      client.withConfig(options)

    const getDocumentExists: ValidationContext['getDocumentExists'] = ({id}) =>
      Promise.resolve(documents.has(id))

    const getLevel = (markers: ValidationMarker[]) => {
      let foundWarning = false
      for (const {level} of markers) {
        if (level === 'error') return 'error'
        if (level === 'warning') foundWarning = true
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

        // remove deprecated `item` from the marker
        markers = result.map(({item, ...marker}) => marker)
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

async function getDocuments(workspace: Workspace, client: SanityClient) {
  const defaultSchema = createSchema({name: 'default', types: []})
  const defaultTypes = defaultSchema.getTypeNames()
  const isCustomType = (type: string) => !defaultTypes.includes(type)
  const typeNames = workspace.schema.getTypeNames().filter(isCustomType)

  const exportUrl = new URL(client.getUrl(`/data/export/${workspace.dataset}`, false))
  exportUrl.searchParams.set('types', typeNames.join(','))

  const documentCount = await client.fetch('length(*[_type in $typeNames])', {typeNames})
  report.event.loadedDocumentCount({documentCount})

  const {token} = client.config()
  const response = await fetch(exportUrl, {
    headers: new Headers({
      ...(token && {Authorization: `Bearer ${token}`}),
    }),
  })

  const reader = response.body?.getReader()

  async function* readerGenerator() {
    if (!reader) {
      throw new Error('Could not get reader from response body.')
    }

    while (true) {
      const {value, done} = await reader.read()
      if (value) yield value
      if (done) return
    }
  }

  const lines = readline.createInterface({input: Readable.from(readerGenerator())})

  let downloadedCount = 0
  const documents = new Map<string, SanityDocument>()

  for await (const line of lines) {
    const document = JSON.parse(line) as SanityDocument
    documents.set(document._id, document)

    downloadedCount++
    report.stream.exportProgress.emit({downloadedCount, documentCount})
  }

  report.stream.exportProgress.end()

  return documents
}
