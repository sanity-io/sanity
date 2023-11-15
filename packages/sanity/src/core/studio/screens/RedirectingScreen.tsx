import React from 'react'
import {DoubleChevronRightIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'

export function RedirectingScreen(props: {reason?: string}) {
  const {reason = 'Redirecting…'} = props

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={0}>
          <Card padding={4} radius={2} shadow={1} tone="primary">
            <Flex>
              <Box>
                <Text size={1}>
                  <DoubleChevronRightIcon />
                </Text>
              </Box>
              <Stack flex={1} marginLeft={3} space={3}>
                <Text as="h1" size={1} weight="bold">
                  {reason}
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
