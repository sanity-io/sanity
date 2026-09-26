import {Card} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {VStack} from 'ui5'

import {selectDefinitions} from '../../../contexts/search/searchSelectors'
import {useSearchSelector} from '../../../contexts/search/useSearchState'
import {type SearchFilter} from '../../../types'
import {getFieldFromFilter} from '../../../utils/filterUtils'

interface DebugDocumentTypesProps {
  filter: SearchFilter
}

export function DebugDocumentTypes({filter}: DebugDocumentTypesProps) {
  const definitions = useSearchSelector(selectDefinitions)
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)

  return (
    <Card borderTop padding={3} tone="transparent">
      <VStack gap={2}>
        <Code size={0} weight="medium">
          Document types
        </Code>
        <Code size={0} style={{whiteSpace: 'normal'}}>
          {fieldDefinition?.documentTypes && fieldDefinition.documentTypes.length > 0
            ? fieldDefinition.documentTypes?.join(', ')
            : '(all)'}
        </Code>
      </VStack>
    </Card>
  )
}
