import {Inline, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import type {SearchableType} from '../../../../../../search'

interface TypePillsProps {
  availableCharacters?: number
  types: SearchableType[]
}

const DEFAULT_AVAILABLE_CHARS = 40 // excluding "+x more" suffix

export function DocumentTypesTruncated({
  availableCharacters = DEFAULT_AVAILABLE_CHARS,
  types,
}: TypePillsProps) {
  /**
   * Get the total number of visible document types whose titles fit within `availableCharacters` count.
   * The first document is always included, regardless of whether it fits within `availableCharacters` or not.
   */
  const visibleTypes = useMemo(
    () =>
      types.reduce<SearchableType[]>(
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
      ),
    [availableCharacters, types]
  )

  const remainingCount = types.length - visibleTypes.length

  if (!types.length) {
    return (
      <Text muted size={1}>
        All types
      </Text>
    )
  }

  return (
    <Inline space={1}>
      <Text muted size={1}>
        {visibleTypes.map(typeTitle).join(', ')}
      </Text>
      {!!remainingCount && (
        <Text muted size={1}>
          +{remainingCount} more
        </Text>
      )}
    </Inline>
  )
}

function typeTitle(schemaType: SearchableType) {
  return schemaType.title ?? schemaType.name
}
