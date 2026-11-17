import {Button, Card} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {usePaneRouter} from 'sanity/structure'
import {Flex} from 'ui5'

export function CustomPane(props: any) {
  return (
    <Card height="fill" tone="transparent">
      <Flex padding={2} gap={1} flexDirection="column">
        <Code language="json">{JSON.stringify(props, null, 2)}</Code>
        <Item id="foo" />
        <Item id="bar" />
        <Item id="baz" />
        <Item id="qux" />
      </Flex>
    </Card>
  )
}

function Item({id}: {id: string}) {
  const {ChildLink} = usePaneRouter()

  return (
    <Button
      as={ChildLink}
      childId={id}
      text={
        <>
          Open <code>{id}</code>
        </>
      }
    />
  )
}
