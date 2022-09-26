import {Card, Container, Flex} from '@sanity/ui'
import React from 'react'
import {ChangeBreadcrumb} from '../diff/components/ChangeBreadcrumb'

export default function ChangeBreadCrumbStory() {
  return (
    <Card height="fill" padding={4} tone="transparent">
      <Flex align="center" height="fill" justify="center">
        <Container width={0}>
          <Card>
            <ChangeBreadcrumb titlePath={['Bread', 'Crumb']} />
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
