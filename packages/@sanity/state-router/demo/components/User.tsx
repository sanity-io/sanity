import {StateLink} from '@sanity/state-router'
import {Card, Heading, Stack, Text} from '@sanity/ui'
import React from 'react'

export function User(props: {id: string}) {
  const {id} = props
  const nextUserId = Math.random().toString(32).substring(2)

  return (
    <Card padding={4} shadow={1} tone="transparent">
      <Stack space={4}>
        <Heading>Showing a lot of information about user #{id}</Heading>
        <Text>
          <StateLink state={{userId: nextUserId}}>Go to user #{nextUserId}</StateLink>
        </Text>
        <Text>
          <StateLink state={{userId: 'me'}}>Go to user #me</StateLink>
        </Text>
      </Stack>
    </Card>
  )
}
