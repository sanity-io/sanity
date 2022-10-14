import {Box, Card, Flex, Text, Theme} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {TextWithTone} from '../../../../../components/TextWithTone'
import type {SearchableType} from '../../../../../search'

interface TypePillsProps {
  availableCharacters?: number
  types: SearchableType[]
}

const DEFAULT_AVAILABLE_CHARS = 40 // excluding "+x more" suffix

const PillCard = styled(Card)<{$collapsible?: boolean}>`
  background: ${({theme}: {theme: Theme}) =>
    theme.sanity.color.selectable?.primary.enabled.code.bg};
  flex-shrink: ${({$collapsible}) => ($collapsible ? 1 : 0)};
  overflow: hidden;
`

const RemainingCountBox = styled(Box)`
  flex-shrink: 0;
`

export function TypePills({availableCharacters = DEFAULT_AVAILABLE_CHARS, types}: TypePillsProps) {
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
    return null
  }

  return (
    <Flex align="center" gap={1}>
      {visibleTypes.map((schemaType) => {
        const title = typeTitle(schemaType)

        return (
          <PillCard $collapsible={visibleTypes.length === 1} key={title} padding={2} radius={2}>
            <TextWithTone size={1} textOverflow="ellipsis" tone="primary" weight="medium">
              {title}
            </TextWithTone>
          </PillCard>
        )
      })}
      {!!remainingCount && (
        <Text muted size={1}>
          <RemainingCountBox marginLeft={1}>+{remainingCount} more</RemainingCountBox>
        </Text>
      )}
    </Flex>
  )
}

function typeTitle(schemaType: SearchableType) {
  return schemaType.title ?? schemaType.name
}
