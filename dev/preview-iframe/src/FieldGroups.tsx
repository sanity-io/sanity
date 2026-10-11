import {Card, Spinner, Text} from '@sanity/ui'
import {Flex, Box, VStack} from 'ui5'

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
      objectArray:
        | [
            {
              _key: string
              stringAlpha: string | null
              stringBeta: string | null
            },
          ]
        | null
    }[]
  >(
    /* groq */ `*[_type == "fieldGroupsWithFieldsetsHidden"][0..10]{_id,field1,field2,nested{field3,field4,field5,nested{field6,field7,field8}},objectArray}`,
  )

  if (error) {
    throw error
  }

  if (loading) {
    return (
      <Flex
        alignItems="center"
        flexDirection="column"
        height="100%"
        justifyContent="center"
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
            <VStack gap={4}>
              <Text weight={'bold'}>{item.field1 || 'N/A'}</Text>
              <Text weight={'bold'}>{item.field2 || 'N/A'}</Text>
              {item.nested && (
                <Flex gap={4} paddingLeft={2} flexDirection="column">
                  <Text>{item.nested.field3 || 'N/A'}</Text>
                  <Text>{item.nested.field4 || 'N/A'}</Text>
                  <Text>{item.nested.field5 || 'N/A'}</Text>
                  {item.nested.nested && (
                    <Flex gap={4} paddingLeft={2} flexDirection="column">
                      <Text>{item.nested.nested.field6 || 'N/A'}</Text>
                      <Text>{item.nested.nested.field7 || 'N/A'}</Text>
                      <Text>{item.nested.nested.field8 || 'N/A'}</Text>
                    </Flex>
                  )}
                </Flex>
              )}
              <Flex gap={4} paddingLeft={2} flexDirection="column">
                {item.objectArray?.map((object) => (
                  <Flex key={object._key} gap={4} paddingLeft={2} flexDirection="column">
                    <Text>{object.stringAlpha || 'N/A'}</Text>
                    <Text>{object.stringBeta || 'N/A'}</Text>
                  </Flex>
                ))}
              </Flex>
            </VStack>
          </Card>
        )
      })}
    </Box>
  )
}
