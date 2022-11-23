import type {SearchableType} from '../../../../../search'

const DEFAULT_AVAILABLE_CHARS = 40 // excluding "+x more" suffix

export function documentTypesTruncated({
  availableCharacters = DEFAULT_AVAILABLE_CHARS,
  types,
}: {
  availableCharacters?: number
  types: SearchableType[]
}): string {
  /**
   * Get the total number of visible document types whose titles fit within `availableCharacters` count.
   * The first document is always included, regardless of whether it fits within `availableCharacters` or not.
   */
  const visibleTypes = types.reduce<SearchableType[]>(
    (function () {
      let remaining = availableCharacters
      return function (acc, val, index) {
        const title = typeTitle(val)
        remaining -= title.length

        // Always include the first type, regardless of title length
        if (index === 0) {
          acc.push(val)
        } else if (availableCharacters > title.length && remaining > title.length) {
          acc.push(val)
        }
        return acc
      }
    })(),
    []
  )

  const remainingCount = types.length - visibleTypes.length

  if (!types.length) {
    return 'All types'
  }

  return [
    `${visibleTypes.map(typeTitle).join(', ')}`,
    ...(remainingCount ? [`+${remainingCount} more`] : []),
  ].join(' ')
}

function typeTitle(schemaType: SearchableType) {
  return schemaType.title ?? schemaType.name
}
