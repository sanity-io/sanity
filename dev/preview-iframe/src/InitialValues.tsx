import {Box, Card, Flex, Heading, Stack, Text} from '@sanity/ui'

import {useQuery} from './loader'

export function InitialValues(): React.JSX.Element {
  const {data, loading, error} = useQuery<
    {
      _id: string
      _type: string
      title: string | null
      author: {
        name: string | null
      } | null
    }[]
  >(/* groq */ `*[_type == "book" && defined(title)] | order(_updatedAt desc) [0..9]{
      _id, 
      _type, 
      title, 
      "author": author->{name}
    }`)

  if (error) {
    throw error
  }

  if (loading) {
    return <p>Loading...</p>
  }

  if (!data?.length) {
    return <p>No books found</p>
  }

  return (
    <Stack padding={4} space={4}>
      <Box>
        <Heading as="h1" size={1}>
          Books: Add an author
        </Heading>
      </Box>
      {data.map((item, i) => (
        <Card key={item._id} padding={4} shadow={2} radius={2}>
          <Flex align="flex-start" justify="space-between" gap={3}>
            <Stack space={2}>
              <Heading as="h1" size={1}>
                {item.title}
              </Heading>
              <Text size={1}>{item.author?.name || 'No Author'}</Text>
            </Stack>
            <Text size={1}>{i + 1}</Text>
          </Flex>
        </Card>
      ))}
    </Stack>
  )
}
