import {stegaClean} from '@sanity/client/stega'
import {Box, Card, Code, Stack, Text} from '@sanity/ui'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {registerLanguage} from 'react-refractor'
import markdown from 'refractor/markdown'

import {useQuery} from './loader'

registerLanguage(markdown)

export function Markdown(): React.JSX.Element {
  const {data, loading, error} = useQuery<
    {
      _id: string
      _type: string
      title: string | null
      markdown: string | null
    }[]
  >(/* groq */ `*[_type == "markdownTest"][0..10]{_id,_type,title,markdown}`)

  if (error) {
    throw error
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <Box paddingX={4}>
      {data?.map((item) => {
        const dataAttribute = createDataAttribute({id: item._id, type: item._type})
        return (
          <Card key={item._id} padding={4}>
            <Stack space={4}>
              <Text weight={'bold'}>{item.title}</Text>
              <Code
                data-sanity={dataAttribute('markdown')}
                language="markdown"
                style={{overflowX: 'auto', overflowY: 'clip', paddingBlock: '1rem'}}
              >
                {stegaClean(item.markdown)}
              </Code>
            </Stack>
          </Card>
        )
      })}
    </Box>
  )
}
