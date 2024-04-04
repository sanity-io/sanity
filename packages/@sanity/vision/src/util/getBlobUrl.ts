import {json2csv} from 'json-2-csv'

function getBlobUrl(content: string, mimeType: string): string {
  return URL.createObjectURL(
    new Blob([content], {
      type: mimeType,
    }),
  )
}

function getMemoizedBlobUrlResolver(mimeType: string, stringEncoder: (input: any) => string) {
  return (() => {
    let prevResult = ''
    let prevContent = ''
    return (input: unknown) => {
      const content = stringEncoder(input)
      if (typeof content !== 'string' || content === '') {
        return undefined
      }

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
