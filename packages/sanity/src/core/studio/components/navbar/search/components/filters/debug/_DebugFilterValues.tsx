import {Card} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {VStack} from 'ui5'

import {selectDefinitions} from '../../../contexts/search/searchSelectors'
import {useSearchSelector} from '../../../contexts/search/useSearchState'
import {type SearchFilter} from '../../../types'
import {getFieldFromFilter} from '../../../utils/filterUtils'

interface DebugFilterValuesProps {
  filter: SearchFilter
}

export function DebugFilterValues({filter}: DebugFilterValuesProps) {
  const definitions = useSearchSelector(selectDefinitions)
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)

  return (
    <Card borderTop padding={3} tone="transparent">
      <VStack gap={2}>
        <Code size={0} weight="medium">
          Filter
        </Code>
        {fieldDefinition?.fieldPath && <Code size={0}>fieldPath: {fieldDefinition.fieldPath}</Code>}
        <Code size={0} style={{whiteSpace: 'normal'}}>
          filterName: {filter.filterName}
        </Code>
        <Code size={0} style={{whiteSpace: 'normal'}}>
          operatorType: {filter.operatorType}
        </Code>
        <Code size={0} style={{whiteSpace: 'normal'}}>
          value: {typeof filter?.value === 'undefined' ? '' : JSON.stringify(filter.value)}
        </Code>
      </VStack>
    </Card>
  )
}
