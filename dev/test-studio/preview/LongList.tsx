import {Box, Card, Flex, Heading, Stack, Text} from '@sanity/ui'

import {useQuery} from './loader'

export function LongList(): React.JSX.Element {
  const {data, loading, error} = useQuery<{
    _id: string
    _type: string
    title: string | null
    objectArrayWithPrefinedStringField: Array<{
      _key: string
      _type: string
      fieldA: string | null
      fieldB: string | null
      fieldC: string | null
    }>
  } | null>(
    /* groq */ `*[_type == "arraysTest" && count(objectArrayWithPrefinedStringField) >= 20][0]{_id, _type, title, objectArrayWithPrefinedStringField[]{_key, _type, fieldA, fieldB, fieldC}}`,
  )

  if (error) {
    throw error
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <Stack padding={4} space={4}>
      <Box>
        <Heading as="h1" size={1}>
          {data.title}
        </Heading>
      </Box>
      {data.objectArrayWithPrefinedStringField.map((item, i) => (
        <Card key={item._key} padding={4} shadow={2} radius={2}>
          <Flex align="flex-start" justify="space-between" gap={3}>
            <Stack space={2}>
              <Text>{item.fieldA || 'N/A'}</Text>
              <Text>{item.fieldB || 'N/A'}</Text>
              <Text>{item.fieldC || 'N/A'}</Text>
            </Stack>
            <Text size={1}>{i + 1}</Text>
          </Flex>
        </Card>
      ))}
    </Stack>
  )
}
