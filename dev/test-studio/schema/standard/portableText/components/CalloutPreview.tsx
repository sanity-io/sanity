import {Box, Card, CardTone, Flex, Text} from '@sanity/ui'
import React from 'react'
import {PreviewProps} from 'sanity'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function CalloutPreview(props: PreviewProps) {
  const {value} = props
  const tone = props.tone || 'default'

  return (
    <Card tone={tone as CardTone}>
      <Flex align="flex-start">
        <Box flex={1} padding={3}>
          <Text size={1} weight="semibold">
            {props.title || <>Untitled</>} ({tone})
          </Text>
          {props.subtitle && (
            <Text muted size={1}>
              {props.subtitle}
            </Text>
          )}
        </Box>
        <div>{props.actions}</div>
      </Flex>
    </Card>
  )
}
