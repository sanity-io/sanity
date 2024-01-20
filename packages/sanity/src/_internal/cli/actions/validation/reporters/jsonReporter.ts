import {type BuiltInValidationReporter} from '../validateAction'

// TODO: replace with Array.fromAsync when it's out of stage3
async function arrayFromAsync<T>(iterable: AsyncIterable<T>) {
  const results: T[] = []
  for await (const item of iterable) results.push(item)
  return results
}

export const json: BuiltInValidationReporter = async ({output, worker}) => {
  const results = await arrayFromAsync(worker.stream.validation())
  const formatted = results
    // report out only documents with some markers
    .filter(({markers}) => markers.length)
    // remove validatedCount from the results
    .map(({validatedCount, ...result}) => result)

  await worker.dispose()

  output.print(JSON.stringify(formatted))

  let overallLevel: 'error' | 'warning' | 'info' = 'info'

  for (const {level} of formatted) {
    if (level === 'error') overallLevel = 'error'
    if (level === 'warning' && overallLevel !== 'error') overallLevel = 'warning'
  }

  return overallLevel
}
