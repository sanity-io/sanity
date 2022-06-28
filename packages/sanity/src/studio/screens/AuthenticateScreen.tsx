import {Flex, Card, Container} from '@sanity/ui'
import React from 'react'
import {WorkspaceAuth} from '../components/navbar/workspace'

export function AuthenticateScreen() {
  return (
    <Card height="fill">
      <Flex align="center" justify="center" height="fill">
        <Container width={0}>
          <WorkspaceAuth />
        </Container>
      </Flex>
    </Card>
  )
}
