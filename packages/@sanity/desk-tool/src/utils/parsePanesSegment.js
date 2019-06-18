/* eslint-disable import/prefer-default-export */
const panePattern = /^([a-z0-9_-]+),?({.*?})?(?:(;|$))/i

export function parsePanesSegment(str) {
  const chunks = []

  let buffer = str
  while (buffer.length) {
    const [match, id, paramsChunk] = buffer.match(panePattern) || []
    if (!match) {
      buffer = buffer.slice(1)
      continue
    }

    const params = paramsChunk && tryParseParams(paramsChunk)
    chunks.push({id, params})

    buffer = buffer.slice(match.length)
  }

  return chunks
}

function tryParseParams(json) {
  try {
    return JSON.parse(json)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse parameters: ${err.message}`)
    return undefined
  }
}
