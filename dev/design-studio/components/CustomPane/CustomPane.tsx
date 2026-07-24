import {Button, Card, Code, Stack} from '@sanity/ui'
import {useCallback} from 'react'
import {usePaneRouter} from 'sanity/structure'

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
