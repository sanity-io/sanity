import {Card} from '@sanity/ui'
import {Code, Box} from 'ui5'

export function JSONPreviewDocumentView(props: any) {
  return (
    <Card overflow="auto" style={{minHeight: '100%'}} tone="transparent">
      <Box padding={4}>
        <Code language="json" size={1} trim>
          {JSON.stringify(props.document.displayed, null, 2)}
        </Code>
      </Box>
    </Card>
  )
}
