import {Card} from '@sanity/ui'
import {Code} from 'ui5'

export function JSONPreviewDocumentView(props: any) {
  return (
    <Card padding={4} sizing="border" style={{minHeight: '100%'}} tone="transparent">
      <Code language="json" trim>
        {JSON.stringify(props.document.displayed, null, 2)}
      </Code>
    </Card>
  )
}
