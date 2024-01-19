import type {BuiltInValidationReporter} from '../validateAction'

export const ndjson: BuiltInValidationReporter = async ({output, worker}) => {
  let overallLevel: 'error' | 'warning' | 'info' = 'info'

  for await (const {
    documentId,
    documentType,
    markers,
    revision,
    level,
  } of worker.stream.validation()) {
    if (level === 'error') overallLevel = 'error'
    if (level === 'warning' && overallLevel !== 'error') overallLevel = 'warning'

    if (markers.length) {
      output.print(JSON.stringify({documentId, documentType, revision, level, markers}))
    }
  }

  await worker.dispose()

  return overallLevel
}
