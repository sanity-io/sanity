import React from 'react'
import {withRouterHOC, StateLink} from '@sanity/base/router'
import {Card, Text, Box, Stack, Container, Heading} from '@sanity/ui'
import {HAS_SPACES} from '../util/spaces'
import {Router} from '../types'

interface OuterProps {
  children: React.ReactNode
}

interface NotFoundProps {
  children: React.ReactNode
  router: Router
}

function NotFound(props: NotFoundProps) {
  const router = props.router
  const rootState =
    HAS_SPACES && router.state && router.state.space ? {space: router.state.space} : {}

  return (
    <Card height="fill" paddingX={[5, 5, 7]} paddingY={[5, 5, 6]} sizing="border">
      <Container>
        <Box marginBottom={5}>
          <Heading as="h1">Page not found</Heading>
        </Box>

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

export default (withRouterHOC(NotFound) as any) as React.ComponentType<OuterProps>
