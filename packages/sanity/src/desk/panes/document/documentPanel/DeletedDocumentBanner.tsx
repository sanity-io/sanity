import React from 'react'
import {Box, Card, Container, Flex, Text} from '@sanity/ui'
import {ReadOnlyIcon} from '@sanity/icons'
import styled from 'styled-components'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`
export function DeletedDocumentBanner() {
  return (
    <Root data-testid="deleted-document-banner" shadow={1} tone="transparent">
      <Container paddingX={4} paddingY={3} sizing="border" width={1}>
        <Flex align="flex-start">
          <Text size={1}>
            <ReadOnlyIcon />
          </Text>

          <Box flex={1} marginLeft={3}>
            <Text size={1}>This document is deleted and can’t be edited.</Text>
          </Box>
        </Flex>
      </Container>
    </Root>
  )
}
