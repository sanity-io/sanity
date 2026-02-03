import {Box, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'

import {useQuery} from './loader'

export function FieldGroups(): React.JSX.Element {
  const {data, loading, error} = useQuery<
    {
      _id: string
      field1: string | null
      field2: string | null
      nested: {
        field3: string | null
        field4: string | null
        field5: string | null
        nested: {
          field6: string | null
          field7: string | null
          field8: string | null
        } | null
      } | null
    }[]
  >(
    /* groq */ `*[_type == "fieldGroupsWithFieldsetsHidden"][0..10]{_id,field1,field2,nested{field3,field4,field5,nested{field6,field7,field8}}}`,
  )

  if (error) {
    throw error
  }

  if (loading) {
    return (
      <Flex
        align="center"
        direction="column"
        height="fill"
        justify="center"
        style={{width: '100%'}}
      >
        <Spinner />
      </Flex>
    )
  }

  return (
    <Box paddingX={4}>
      {data?.map((item) => {
        return (
          <Card key={item._id} padding={4}>
            <Stack space={4}>
              <Text weight={'bold'}>{item.field1 || 'N/A'}</Text>
              <Text weight={'bold'}>{item.field2 || 'N/A'}</Text>
              {item.nested && (
                <Stack space={4} paddingLeft={2}>
                  <Text>{item.nested.field3 || 'N/A'}</Text>
                  <Text>{item.nested.field4 || 'N/A'}</Text>
                  <Text>{item.nested.field5 || 'N/A'}</Text>
                  {item.nested.nested && (
                    <Stack space={4} paddingLeft={2}>
                      <Text>{item.nested.nested.field6 || 'N/A'}</Text>
                      <Text>{item.nested.nested.field7 || 'N/A'}</Text>
                      <Text>{item.nested.nested.field8 || 'N/A'}</Text>
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        )
      })}
    </Box>
  )
}
