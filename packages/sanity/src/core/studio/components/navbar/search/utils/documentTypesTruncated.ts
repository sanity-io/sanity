import {TFunction} from '../../../../../i18n'
import type {SearchableType} from '../../../../../search'

const DEFAULT_AVAILABLE_CHARS = 40 // excluding "+x more" suffix

export function documentTypesTruncated({
  availableCharacters = DEFAULT_AVAILABLE_CHARS,
  types,
  t,
}: {
  availableCharacters?: number
  types: SearchableType[]
  t: TFunction<'studio', undefined>
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
    [],
  )

  const remainingCount = types.length - visibleTypes.length

  if (!types.length) {
    return t('navbar.search.all-types-label')
  }

  return [
    `${visibleTypes.map(typeTitle).join(', ')}`,
    ...(remainingCount ? [`${t('navbar.search.remaining-document-types', {remainingCount})}`] : []),
  ].join(' ')
}

function typeTitle(schemaType: SearchableType) {
  return schemaType.title ?? schemaType.name
}
