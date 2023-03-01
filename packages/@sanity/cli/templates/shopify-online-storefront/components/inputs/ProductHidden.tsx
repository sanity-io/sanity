import React from 'react'
import {WarningOutlineIcon} from '@sanity/icons'
import {type StringFieldProps, useFormValue} from 'sanity'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'

import {productUrl} from '../../utils/shopifyUrls'

type Store = {
  id: number
  status: string
  isDeleted: boolean
}

export default function ProductHiddenInput(props: StringFieldProps) {
  const store: Store = useFormValue(['store']) as Store

  if (!store) {
    return <></>
  }

  const shopifyProductUrl = productUrl(store?.id)
  const isActive = store?.status === 'active'
  const isDeleted = store?.isDeleted

  let message
  if (!isActive) {
    message = (
      <>
        It does not have an <code>active</code> status in Shopify.
      </>
    )
  }
  if (isDeleted) {
    message = 'It has been deleted from Shopify.'
  }

  return (
    <Card padding={4} radius={2} shadow={1} tone="critical">
      <Flex align="flex-start">
        <Text size={2}>
          <WarningOutlineIcon />
        </Text>
        <Box flex={1} marginLeft={3}>
          <Box>
            <Text size={2} weight="semibold">
              This product is hidden
            </Text>
          </Box>
          <Stack marginTop={4} space={2}>
            <Text size={1}>{message}</Text>
          </Stack>
          {!isDeleted && shopifyProductUrl && (
            <Box marginTop={4}>
              <Text size={1}>
                →{' '}
                <a href={shopifyProductUrl} target="_blank" rel="noreferrer">
                  View this product on Shopify
                </a>
              </Text>
            </Box>
          )}
        </Box>
      </Flex>
    </Card>
  )
}
