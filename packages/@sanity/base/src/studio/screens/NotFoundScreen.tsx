import {Card, Heading} from '@sanity/ui'
import React from 'react'

export function NotFoundScreen() {
  return (
    <Card height="fill" padding={4} sizing="border">
      <Heading as="h1">Not found</Heading>
    </Card>
  )
}
