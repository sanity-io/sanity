import type {ValidationMarker} from '@sanity/types'
import type {BuiltInValidationReporter} from '../validateAction'

export const json: BuiltInValidationReporter = async ({output, worker}) => {
  let overallLevel: 'error' | 'warning' | 'info' = 'info'

  const results: Array<{
    documentId: string
    documentType: string
    revision: string
    level: 'error' | 'warning' | 'info'
    markers: ValidationMarker[]
  }> = []

  for await (const {
    documentId,
    documentType,
    markers,
    revision,
    level,
  } of worker.stream.validation()) {
    if (level === 'error') overallLevel = 'error'
    if (level === 'warning' && overallLevel !== 'error') overallLevel = 'warning'

    results.push({
      documentId,
      documentType,
      revision,
      level,
      markers,
    })
  }

  await worker.dispose()

  output.print(JSON.stringify(results))

  return overallLevel
}
