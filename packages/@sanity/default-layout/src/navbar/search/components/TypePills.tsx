import {TextWithTone} from '@sanity/base/components'
import {hues} from '@sanity/color'
import {SchemaType} from '@sanity/types'
import {Box, Card, Flex, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'

interface TypePillsProps {
  availableCharacters?: number
  types: SchemaType[]
}

const DEFAULT_AVAILABLE_CHARS = 40

export function TypePills({availableCharacters = DEFAULT_AVAILABLE_CHARS, types}: TypePillsProps) {
  /**
   * Get the first X document types, where the sum of all title characters across X types is < availableCharacters
   */
  const visibleTypes = useMemo(
    () =>
      types.reduce<SchemaType[]>(
        (function () {
          let remaining = availableCharacters
          return function (acc, val) {
            const title = typeTitle(val)
            if (availableCharacters > title.length && remaining > title.length) {
              remaining -= title.length
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
          <Pill key={title} padding={2} radius={2}>
            <TextWithTone size={1} textOverflow="ellipsis" tone="primary" weight="medium">
              {title}
            </TextWithTone>
          </Pill>
        )
      })}
      {!!remainingCount && (
        <Box marginLeft={1}>
          <Text muted size={1}>
            +{remainingCount} more
          </Text>
        </Box>
      )}
    </Flex>
  )
}

function typeTitle(schemaType: SchemaType) {
  return schemaType.title ?? schemaType.name
}

const Pill = styled(Card)`
  background: ${hues.blue[50].hex};
  flex-shrink: 0;
  overflow: hidden;
`
