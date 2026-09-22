import {Card} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {VStack} from 'ui5'

import {useSearchState} from '../../../contexts/search/useSearchState'

export function DebugDocumentTypesNarrowed() {
  const {
    state: {documentTypesNarrowed},
  } = useSearchState()

  return (
    <Card borderTop padding={4} tone="transparent">
      <VStack gap={3}>
        <Code size={1} weight="medium">
          Document types (narrowed)
        </Code>
        <Code size={1} style={{whiteSpace: 'normal'}}>
          {documentTypesNarrowed.length > 0 ? documentTypesNarrowed.join(', ') : '(All)'}
        </Code>
      </VStack>
    </Card>
  )
}
