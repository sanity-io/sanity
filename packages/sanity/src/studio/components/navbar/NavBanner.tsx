import {Icon, IconSymbol} from '@sanity/icons'
import {Card, CardTone, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'

interface NavBannerProps {
  title?: string
  description?: string
  iconSymbol?: IconSymbol
  tone?: CardTone
}

export function NavBanner(props: NavBannerProps) {
  const {description, iconSymbol, title, tone} = props

  return (
    <Card paddingX={4} paddingY={3} tone={tone}>
      <Flex align="center" gap={1}>
        {iconSymbol && (
          <Text muted size={1}>
            <Icon symbol={iconSymbol} />
          </Text>
        )}

        <Stack space={2} marginLeft={3}>
          {title && (
            <Text muted size={1} weight="semibold">
              {title}
            </Text>
          )}

          {description && (
            <Text muted size={1}>
              {description}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}
