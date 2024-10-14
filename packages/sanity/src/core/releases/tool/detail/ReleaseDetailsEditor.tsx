import {Box, Heading, Text} from '@sanity/ui'
import {type BundleDocument} from 'sanity'

// TODO: This is not a working example, it's just a placeholder. A proper editor should be implemented.
export function ReleaseDetailsEditor({
  description,
  title,
}: {
  description: BundleDocument['description']
  title: BundleDocument['title']
}) {
  return (
    <>
      <Box paddingBottom={3}>
        <Heading size={3} style={{margin: '1px 0'}} as="h1">
          {title}
        </Heading>
      </Box>
      <Box paddingTop={3}>
        <Text muted size={2} style={{maxWidth: 600}}>
          {description || 'Describe the release...'}
        </Text>
      </Box>
    </>
  )
}
