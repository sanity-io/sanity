import {type BuiltInValidationReporter} from '../validateAction'

export const ndjson: BuiltInValidationReporter = async ({output, worker}) => {
  let overallLevel: 'error' | 'warning' | 'info' = 'info'

  for await (const {validatedCount, ...result} of worker.stream.validation()) {
    if (result.level === 'error') overallLevel = 'error'
    if (result.level === 'warning' && overallLevel !== 'error') overallLevel = 'warning'

    if (result.markers.length) {
      output.print(JSON.stringify(result))
    }
  }

  await worker.dispose()

  return overallLevel
}
