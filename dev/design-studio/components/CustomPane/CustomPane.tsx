import React, {useCallback} from 'react'
import {Card, Code, Stack} from '@sanity/ui'
import {usePaneRouter} from 'sanity/desk'
import {Button} from '../../../../packages/sanity/src/ui'

export function CustomPane(props: any) {
  return (
    <Card height="fill" tone="transparent">
      <Stack padding={2} space={1}>
        <Code language="json">{JSON.stringify(props, null, 2)}</Code>
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

  const Link = useCallback(
    (linkProps: any) => <ChildLink {...linkProps} childId={id} />,
    [ChildLink, id],
  )

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
