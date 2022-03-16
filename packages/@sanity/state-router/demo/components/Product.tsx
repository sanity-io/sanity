import {StateLink, IntentLink, WithRouter} from '@sanity/state-router'
import {Button, Card, Code, Heading, Label, Stack, Text} from '@sanity/ui'
import React from 'react'
import {NeverUpdate} from './NeverUpdate'

export function Product(props: {id: string}) {
  const {id} = props
  const nextProductId = Math.random().toString(32).substring(2)

  return (
    <Card padding={4} shadow={1}>
      <Stack space={4}>
        <Text>
          <StateLink toIndex>Up…</StateLink>
        </Text>
        <Label>Product</Label>
        <Heading>Showing a lot of information about product #{id}</Heading>
        <Text>
          <StateLink state={{id, detailView: 'details'}}>View more details</StateLink>
        </Text>
        <Text>
          <StateLink state={{id: nextProductId}}>Go to product #{nextProductId}</StateLink>
        </Text>
        <Text>
          This is an intent link:{' '}
          <IntentLink intent="open" params={{type: 'product', id: 'foo'}}>
            Open Foo
          </IntentLink>
        </Text>
        <Text>
          <WithRouter>
            {(router) => (
              <Button
                type="button"
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() =>
                  router.navigateIntent('open', {
                    type: 'product',
                    id: 'foobar',
                  })
                }
                text={
                  <>
                    Click to programmatically navigate to intent <code>open</code> product{' '}
                    <code>id=foobar</code>
                  </>
                }
              />
            )}
          </WithRouter>
        </Text>
        <WithRouter>{(router) => <Code>{JSON.stringify(router.state, null, 2)}</Code>}</WithRouter>

        <NeverUpdate />
      </Stack>
    </Card>
  )
}
