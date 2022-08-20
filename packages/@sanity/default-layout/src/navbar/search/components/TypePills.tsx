import {TextWithTone} from '@sanity/base/components'
import {SchemaType} from '@sanity/types'
import {Box, Card, Flex, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'

interface TypePillsProps {
  availableCharacters?: number
  types: SchemaType[]
}

const DEFAULT_AVAILABLE_CHARS = 40 // excluding "+x more" suffix

export function TypePills({availableCharacters = DEFAULT_AVAILABLE_CHARS, types}: TypePillsProps) {
  /**
   * Get the total number of visible document types whose titles fit within `availableCharacters` count.
   * The first document is always included, regardless of whether it fits within `availableCharacters` or not.
   */
  const visibleTypes = useMemo(
    () =>
      types.reduce<SchemaType[]>(
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
    return null
  }

  return (
    <Flex align="center" gap={1}>
      {visibleTypes.map((schemaType) => {
        const title = typeTitle(schemaType)

        return (
          <Pill $collapsible={visibleTypes.length === 1} key={title} padding={2} radius={2}>
            <TextWithTone size={1} textOverflow="ellipsis" tone="primary" weight="medium">
              {title}
            </TextWithTone>
          </Pill>
        )
      })}
      {!!remainingCount && (
        <Text muted size={1}>
          <RemainingCount marginLeft={1}>+{remainingCount} more</RemainingCount>
        </Text>
      )}
    </Flex>
  )
}

function typeTitle(schemaType: SchemaType) {
  return schemaType.title ?? schemaType.name
}

const Pill = styled(Card)<{$collapsible?: boolean}>`
  background: ${({theme}) => theme.sanity.color.selectable.primary.enabled.code.bg};
  flex-shrink: ${({$collapsible}) => ($collapsible ? 1 : 0)};
  overflow: hidden;
`

const RemainingCount = styled(Box)`
  flex-shrink: 0;
`
