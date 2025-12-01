import {Card, Code, Heading, Stack, Text} from '@sanity/ui'

interface ListOverviewProps {
  title: string
  options?: Record<string, unknown>
}

export function ListOverview(props: ListOverviewProps) {
  const {title, options} = props

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Heading size={1}>Overview: {title}</Heading>

        <Text>This is a custom overview component that appears when no list item is selected.</Text>

        {options && Object.keys(options).length > 0 && (
          <>
            <Text weight="semibold">Options passed to component:</Text>
            <Code language="json">{JSON.stringify(options, null, 2)}</Code>
          </>
        )}

        <Text muted size={1}>
          Select an item from the list to see its details.
        </Text>
      </Stack>
    </Card>
  )
}
