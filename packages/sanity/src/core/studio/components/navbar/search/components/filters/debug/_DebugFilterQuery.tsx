import {Card} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {VStack} from 'ui5'

import {useSearchSelector} from '../../../contexts/search/useSearchState'

export function DebugFilterQuery() {
  const filter = useSearchSelector((snapshot) => snapshot.context.terms.filter)

  if (!filter) {
    return null
  }

  return (
    <Card padding={4} tone="transparent">
      <VStack gap={3}>
        <Code size={1} weight="medium">
          Filter
        </Code>
        {filter && (
          <Code size={1} style={{whiteSpace: 'normal'}}>
            {filter}
          </Code>
        )}
      </VStack>
    </Card>
  )
}
