import {ValidationMarker} from '@sanity/types'
import chalk from 'chalk'
import type {BuiltInValidationReporter} from '../validateAction'

interface ValidationTree {
  markers: Pick<ValidationMarker, 'level' | 'message'>[]
  children?: Record<string, ValidationTree>
}

interface ValidationSummary {
  valid: {documents: number}
  errors: {documents: number; markers: number}
  warnings: {documents: number; markers: number}
  infos: {documents: number; markers: number}
}

const f = (count: number, word: string) =>
  `${count.toLocaleString()} ${count === 1 ? word.substring(0, word.length - 1) : word}`

const percent = new Intl.NumberFormat(undefined, {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
}).format.bind(Intl.NumberFormat)

const seconds = (startTime: number) => {
  const endTime = Date.now()
  const formatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return `(${formatter.format((endTime - startTime) / 1000)}s)`
}

const summaryText = ({errors, infos, valid, warnings}: ValidationSummary) => {
  const b = [chalk.green('✔️'), chalk.red('✖'), chalk.yellow('⚠'), chalk.cyan('ℹ')] as const

  return `${b[0]} Valid:    ${f(valid.documents, 'documents')}
${b[1]} Errors:   ${f(errors.documents, 'documents')}, ${f(errors.markers, 'errors')}
${b[2]} Warnings: ${f(warnings.documents, 'documents')}, ${f(warnings.markers, 'warnings')}
${b[3]} Info:     ${f(infos.documents, 'documents')}, ${f(infos.documents, 'markers')}
`
}

function convertToTree(markers: ValidationMarker[]) {
  const root: ValidationTree = {markers: []}

  // add the markers to the tree
  function addMarker(marker: ValidationMarker, node: ValidationTree = root) {
    if (!marker.path.length) {
      node.markers.push({level: marker.level, message: marker.message})
      return
    }

    const [current, ...rest] = marker.path
    const key = JSON.stringify(current)

    if (!node.children) {
      node.children = {}
    }

    if (!(key in node.children)) {
      node.children[key] = {markers: []}
    }

    addMarker({...marker, path: rest}, node.children[key])
  }

  for (const marker of markers) {
    addMarker(marker)
  }

  return root
}

interface DocumentValidation {
  tree: ValidationTree
  revision: string
  documentId: string
  documentType: string
  level: ValidationMarker['level']
}

export const pretty: BuiltInValidationReporter = async ({output, worker, flags}) => {
  const workspaceLoadStart = Date.now()
  // Report workspace loaded
  const spinner = output
    .spinner(flags.workspace ? `Loading workspace '${flags.workspace}'…` : 'Loading workspace…')
    .start()

  const workspace = await worker.event.loadedWorkspace()
  spinner.succeed(
    `Loaded workspace '${workspace.name}' using project '${workspace.projectId}' and dataset '${
      flags.dataset || workspace.dataset
    }' ${seconds(workspaceLoadStart)}`,
  )

  // Report document count
  spinner.start('Calculating documents to be validated…')
  const {documentCount} = await worker.event.loadedDocumentCount()

  // Report export progress
  const downloadStart = Date.now()
  spinner.text = `Downloading ${f(documentCount, 'documents')}…`
  for await (const {downloadedCount} of worker.stream.exportProgress()) {
    const percentage = percent(downloadedCount / documentCount)
    spinner.text = `Downloading ${f(documentCount, 'documents')}… ${percentage}`
  }
  spinner.succeed(`Downloaded ${f(documentCount, 'documents')} ${seconds(downloadStart)}`)

  // Report validation progress
  const validationStart = Date.now()
  spinner.start(`Validating ${f(documentCount, 'documents')}…`)

  const validation: DocumentValidation[] = []

  const summary: ValidationSummary = {
    valid: {documents: 0},
    errors: {documents: 0, markers: 0},
    warnings: {documents: 0, markers: 0},
    infos: {documents: 0, markers: 0},
  }

  for await (const {
    validatedCount,
    documentId,
    documentType,
    markers,
    revision,
    level,
  } of worker.stream.validation()) {
    if (markers.length) {
      validation.push({documentId, revision, level, documentType, tree: convertToTree(markers)})
    }

    const errors = markers.filter((marker) => marker.level === 'error')
    const warnings = markers.filter((marker) => marker.level === 'warning')
    const infos = markers.filter((marker) => marker.level === 'info')

    if (!markers.length) {
      summary.valid.documents += 1
    }

    if (errors.length) {
      summary.errors.documents += 1
      summary.errors.markers += errors.length
    }

    if (warnings.length) {
      summary.warnings.documents += 1
      summary.warnings.markers += warnings.length
    }

    if (infos.length) {
      summary.infos.documents += 1
      summary.infos.markers += infos.length
    }

    spinner.text =
      `Validating ${f(documentCount, 'documents')}…\n\n` +
      `Processed ${f(validatedCount, 'documents')} (${percent(
        validatedCount / documentCount,
      )}):\n${summaryText(summary)}`
  }

  spinner.succeed(`Validated ${f(documentCount, 'documents')} ${seconds(validationStart)}`)
  output.print(`\nValidation results:\n${summaryText(summary)}`)

  const values = {error: 2, warning: 1, info: 0}
  validation.sort((a, b) => {
    if (a.level === b.level) return a.documentType.localeCompare(b.documentType)
    return values[b.level] - values[a.level]
  })

  let overallLevel: 'error' | 'warning' | 'info' = 'info'

  for (const {documentType, documentId, level, tree} of validation) {
    if (level === 'error') overallLevel = 'error'
    if (level === 'warning' && overallLevel !== 'error') overallLevel = 'warning'

    const styledLevel =
      // eslint-disable-next-line no-nested-ternary
      level === 'error'
        ? chalk.bgRed('ERROR')
        : level === 'warning'
          ? chalk.bgYellow('WARN')
          : chalk.bgCyan('INFO')

    output.print(`${styledLevel} / ${documentType} / ${documentId}`)
    if (workspace.studioHost) {
      output.print(
        `=> ${workspace.studioHost}${workspace.basePath}/intent/edit/id=${encodeURIComponent(
          documentId,
        )};type=${encodeURIComponent(documentType)}`,
      )
    }

    output.print(JSON.stringify(tree, null, 2))
    output.print()
  }

  await worker.dispose()

  return overallLevel
}
