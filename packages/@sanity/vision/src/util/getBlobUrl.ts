import {json2csv} from 'json-2-csv'

function getBlobUrl(content: string, mimeType: string): string {
  return URL.createObjectURL(
    new Blob([content], {
      type: mimeType,
    }),
  )
}

const NOTHING = Symbol('nothing')

/**
 * One blob URL per encoder, replaced (and the previous one revoked) when the encoded content
 * changes. The value last encoded is remembered as well, so asking for the same result again
 * costs nothing: results are never mutated, and encoding one only to compare it is the expensive
 * part for a large result.
 */
function getMemoizedBlobUrlResolver(mimeType: string, stringEncoder: (input: any) => string) {
  return (() => {
    let prevInput: unknown = NOTHING
    let prevResult = ''
    let prevContent = ''
    return (input: unknown) => {
      if (input === prevInput && prevResult) {
        return prevResult
      }

      const content = stringEncoder(input)
      if (typeof content !== 'string' || content === '') {
        return undefined
      }

      prevInput = input
      if (content === prevContent) {
        return prevResult
      }

      prevContent = content
      if (prevResult) {
        URL.revokeObjectURL(prevResult)
      }

      prevResult = getBlobUrl(content, mimeType)
      return prevResult
    }
  })()
}

export const getJsonBlobUrl = getMemoizedBlobUrlResolver('application/json', (input) =>
  JSON.stringify(input, null, 2),
)

export const getCsvBlobUrl = getMemoizedBlobUrlResolver('text/csv', (input) => {
  return json2csv(Array.isArray(input) ? input : [input]).trim()
})

/**
 * Whether `getCsvBlobUrl` can produce anything for a result: `json2csv` yields nothing unless at
 * least one item is an object. A look at the shape, so a download button can be disabled without
 * converting a result nobody asked to download.
 */
export function canEncodeCsv(input: unknown): boolean {
  const items = Array.isArray(input) ? input : [input]
  return items.some((item) => typeof item === 'object' && item !== null && !Array.isArray(item))
}
