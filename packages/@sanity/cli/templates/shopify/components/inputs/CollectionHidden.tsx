import React from 'react'
import {WarningOutlineIcon} from '@sanity/icons'
import {StringFieldProps} from 'sanity'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'

export default function CollectionHiddenInput(props: StringFieldProps) {
  return (
    <Card padding={4} radius={2} shadow={1} tone="critical">
      <Flex align="flex-start">
        <Text>
          <WarningOutlineIcon />
        </Text>
        <Box flex={1} marginLeft={3}>
          <Box>
            <Text weight="semibold">
              This collection is hidden
            </Text>
          </Box>
          <Stack marginTop={4} space={2}>
            <Text size={1}>It has been deleted from Shopify.</Text>
          </Stack>
        </Box>
      </Flex>
    </Card>
  )
}
