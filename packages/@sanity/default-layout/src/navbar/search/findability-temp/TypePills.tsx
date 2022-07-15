import {TextWithTone} from '@sanity/base/components'
import {hues} from '@sanity/color'
import {SchemaType} from '@sanity/types'
import {Box, Card, Flex, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'

const MAX_CHARACTERS = 40
const MAX_TYPES = 3

export function TypePills({types}: {types: SchemaType[]}) {
  /**
   * Get the first X document types, where:
   * - X is < MAX_TYPES
   * - the sum of all title characters across X types is < MAX_CHARACTERS
   *
   * Note that the first item is always included, regardless of title length.
   */
  const visibleTypes = useMemo(
    () =>
      types.reduce<SchemaType[]>(
        (function () {
          let remaining = MAX_CHARACTERS
          return function (acc, val, index) {
            const title = typeTitle(val)
            if (index === 0 || (remaining > title.length && index < MAX_TYPES)) {
              remaining -= title.length
              acc.push(val)
            }
            return acc
          }
        })(),
        []
      ),
    [types]
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
  background: ${hues.blue[100].hex};
  flex-shrink: 0;
  max-width: ${MAX_CHARACTERS}ch;
  overflow: hidden;
`
