import {Card} from '@sanity/ui'
import {Code} from '@sanity/ui/code'

export function JSONPreviewDocumentView(props: any) {
  return (
    <Card padding={4} sizing="border" style={{minHeight: '100%'}} tone="transparent">
      <Code language="json">{JSON.stringify(props.document.displayed, null, 2)}</Code>
    </Card>
  )
}
