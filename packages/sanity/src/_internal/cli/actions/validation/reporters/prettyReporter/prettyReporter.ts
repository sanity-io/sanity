import {type BuiltInValidationReporter} from '../../validateAction'
import {formatDocumentValidation} from './formatDocumentValidation'
import {
  count,
  type DocumentValidationResult,
  type Level,
  levelValues,
  percent,
  seconds,
  summary,
} from './util'

/**
 * Represents the default stylish/pretty reporter
 */
// eslint-disable-next-line max-statements
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

  if (!flags.file) {
    // Report document count
    spinner.start('Calculating documents to be validated…')
    const {documentCount} = await worker.event.loadedDocumentCount()

    // Report export progress
    const downloadStart = Date.now()
    spinner.text = `Downloading ${count(documentCount, 'documents')}…`
    for await (const {downloadedCount} of worker.stream.exportProgress()) {
      const percentage = percent(downloadedCount / documentCount)
      spinner.text = `Downloading ${count(documentCount, 'documents')}… ${percentage}`
    }
    spinner.succeed(`Downloaded ${count(documentCount, 'documents')} ${seconds(downloadStart)}`)
  }

  const {totalDocumentsToValidate} = await worker.event.exportFinished()

  const referenceIntegrityStart = Date.now()
  spinner.start(`Checking reference existence…`)
  await worker.event.loadedReferenceIntegrity()
  spinner.succeed(`Checked all references ${seconds(referenceIntegrityStart)}`)

  // Report validation progress
  const validationStart = Date.now()
  spinner.start(`Validating ${count(totalDocumentsToValidate, 'documents')}…`)

  const results: DocumentValidationResult[] = []

  const totals = {
    valid: {documents: 0},
    errors: {documents: 0, markers: 0},
    warnings: {documents: 0, markers: 0},
    infos: {documents: 0, markers: 0},
  }

  for await (const {validatedCount, ...result} of worker.stream.validation()) {
    const {markers} = result

    if (markers.length) {
      results.push(result)
    }

    const errors = markers.filter((marker) => marker.level === 'error')
    const warnings = markers.filter((marker) => marker.level === 'warning')
    const infos = markers.filter((marker) => marker.level === 'info')

    if (!markers.length) {
      totals.valid.documents += 1
    }

    if (errors.length) {
      totals.errors.documents += 1
      totals.errors.markers += errors.length
    }

    if (warnings.length) {
      totals.warnings.documents += 1
      totals.warnings.markers += warnings.length
    }

    if (infos.length) {
      totals.infos.documents += 1
      totals.infos.markers += infos.length
    }

    spinner.text =
      `Validating ${count(totalDocumentsToValidate, 'documents')}…\n\n` +
      `Processed ${count(validatedCount, 'documents')} (${percent(
        validatedCount / totalDocumentsToValidate,
      )}):\n${summary(totals, flags.level)}`
  }

  spinner.succeed(
    `Validated ${count(totalDocumentsToValidate, 'documents')} ${seconds(validationStart)}`,
  )
  output.print(`\nValidation results:\n${summary(totals, flags.level)}`)

  results.sort((a, b) => {
    if (a.level === b.level) return a.documentType.localeCompare(b.documentType)
    return levelValues[a.level] - levelValues[b.level]
  })

  let overallLevel: Level = 'info'

  for (const result of results) {
    if (result.level === 'error') overallLevel = 'error'
    if (result.level === 'warning' && overallLevel !== 'error') overallLevel = 'warning'

    output.print(`${formatDocumentValidation(result)}\n`)
  }

  await worker.dispose()

  return overallLevel
}
