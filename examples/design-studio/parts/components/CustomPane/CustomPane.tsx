import React, {useCallback} from 'react'
import {Button, Card, Stack} from '@sanity/ui'
import {usePaneRouter} from '@sanity/desk-tool'

export function CustomPane() {
  return (
    <Card height="fill" tone="transparent">
      <Stack padding={2} space={1}>
        <Item id="foo" />
        <Item id="bar" />
        <Item id="baz" />
        <Item id="qux" />
      </Stack>
    </Card>
  )
}

function Item({id}: {id: string}) {
  const {ChildLink} = usePaneRouter()

  const Link = useCallback((linkProps: any) => <ChildLink {...linkProps} childId={id} />, [
    ChildLink,
    id,
  ])

  return (
    <Button
      as={Link}
      text={
        <>
          Open <code>{id}</code>
        </>
      }
    />
  )
}
