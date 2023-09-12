import {TFunction} from '../../../../../i18n'
import type {SearchableType} from '../../../../../search'

const DEFAULT_AVAILABLE_CHARS = 40 // excluding "+x more" suffix

/**
 * From the list of provided document types, return as many type names as possible that can fit
 * within the `availableCharacters` parameter, formatted by title where available. Includes the
 * number of remaining types that were _not_ included in the returned array of types, so a UI can
 * choose to display a "+x more" suffix.
 *
 * @see documentTypesTruncated for a helper function that returns a formatted string
 *
 * @param options - Options object
 * @returns An object containing truncated list of types, as well as number of excluded types
 * @internal
 */
export function getDocumentTypesTruncated({
  availableCharacters = DEFAULT_AVAILABLE_CHARS,
  types,
}: {
  availableCharacters?: number
  types: SearchableType[]
}): {types: string[]; remainingCount: number} {
  if (types.length === 0) {
    return {remainingCount: 0, types: []}
  }

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

  return {
    remainingCount: types.length - visibleTypes.length,
    types: visibleTypes.map(typeTitle),
  }
}

/**
 * From the list of provided document types, return as many type names as possible that can fit
 * within the `availableCharacters` parameter, formatted by title where available. Includes the
 * number of remaining types that were _not_ included in the returned array of types, so a UI can
 * choose to display a "+x more" suffix.
 *
 * @param options - Options object
 * @returns A formatted string of types
 * @internal
 */
export function documentTypesTruncated({
  t,
  availableCharacters,
  types,
}: {
  availableCharacters?: number
  types: SearchableType[]
  t: TFunction<'studio', undefined>
}): string {
  if (types.length === 0) {
    return t('search.document-type-list-all-types')
  }

  const {remainingCount, types: visibleTypes} = getDocumentTypesTruncated({
    availableCharacters,
    types,
  })

  const key =
    remainingCount > 0 ? 'search.document-type-list-truncated' : 'search.document-type-list'

  // "Author, Book" or "Author, Book, Pet, Person +2 more"
  return t(key, {
    count: remainingCount,
    types: visibleTypes,
    formatParams: {types: {style: 'short', type: 'unit'}},
  })
}

function typeTitle(schemaType: SearchableType) {
  return schemaType.title ?? schemaType.name
}
