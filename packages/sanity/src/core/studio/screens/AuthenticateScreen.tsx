import {Flex, Card, Container} from '@sanity/ui'
import React from 'react'
import {WorkspaceAuth} from '../components/navbar/workspace'

export function AuthenticateScreen() {
  return (
    <Card height="fill" overflow="auto" paddingX={4}>
      <Flex height="fill" direction="column" align="center" justify="center" paddingTop={4}>
        <Container width={0}>
          <WorkspaceAuth />
        </Container>
      </Flex>
    </Card>
  )
}
