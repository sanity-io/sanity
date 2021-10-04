import React from 'react'
import {StateLink} from '@sanity/base/router'
import {Card, Text, Box, Stack, Container, Heading} from '@sanity/ui'
import {HAS_SPACES} from '../util/spaces'
import {useDefaultLayoutRouter} from '../useDefaultLayoutRouter'

interface NotFoundProps {
  children: React.ReactNode
}

export const NotFound = (props: NotFoundProps) => {
  const router = useDefaultLayoutRouter()
  const rootState = HAS_SPACES && router.state.space ? {space: router.state.space} : {}

  return (
    <Card height="fill" paddingX={[5, 5, 7]} paddingY={[5, 5, 6]} sizing="border">
      <Container>
        <Heading as="h1">Page not found</Heading>

        <Stack space={4} paddingY={4}>
          {props.children && <Box>{props.children}</Box>}

          <Box>
            <Text>
              <StateLink state={rootState}>Go to index</StateLink>
            </Text>
          </Box>
        </Stack>
      </Container>
    </Card>
  )
}
