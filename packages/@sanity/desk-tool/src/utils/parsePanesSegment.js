/* eslint-disable import/prefer-default-export */

// old: authors;knut,{"template":"diaryEntry"}
// new: authors;knut,view=diff,eyJyZXYxIjoiYWJjMTIzIiwicmV2MiI6ImRlZjQ1NiJ9|latest-posts

const reservedParams = ['id', 'params']
const isKeyValue = str => /^[a-z0-9]+=[^=]+/i.test(str)
const isBase64 = str => /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str)
const panePattern = /^([a-z0-9_-]+),?({.*?})?(?:(;|$))/i

export function parsePanesSegment(str) {
  if (str.indexOf(',{') !== -1) {
    return parseOldPanesSegment(str)
  }

  return str
    .split(';')
    .map(group =>
      group
        .split('|')
        .filter(Boolean)
        .map(segment => {
          const [id, ...chunks] = segment.split(',')
          return chunks.reduce(
            (pane, chunk) => {
              if (isKeyValue(chunk)) {
                const key = chunk.slice(0, chunk.indexOf('='))
                const value = chunk.slice(key.length + 1)
                pane[reservedParams.includes(key) ? `_${key}` : key] = value
              } else if (isBase64(chunk)) {
                pane.params = tryParseBase64Params(chunk)
              } else {
                // eslint-disable-next-line no-console
                console.warn('Unknown pane segment: %s - skipping', segment)
              }

              return pane
            },
            {id}
          )
        })
    )
    .filter(group => group.length > 0)
}

export function encodePanesSegment(panes = []) {
  return panes
    .map(group => {
      return group
        .map(({id, params, ...rest}) => {
          const encodedParams = params ? btoa(JSON.stringify(params)) : undefined
          const keyValuePairs = Object.keys(rest).reduce(
            (pairs, key) => [...pairs, `${key}=${rest[key]}`],
            []
          )

          return [id, keyValuePairs.length > 0 && keyValuePairs, encodedParams]
            .filter(Boolean)
            .join(',')
        })
        .join('|')
    })
    .map(encodeURIComponent)
    .join(';')
}

export function parseOldPanesSegment(str) {
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

function tryParseBase64Params(data) {
  return tryParseParams(atob(data))
}
