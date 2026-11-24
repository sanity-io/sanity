import {Card} from '@sanity/ui'
import {Code, VStack} from 'ui5'

import {useSearchState} from '../../../contexts/search/useSearchState'

export function DebugFilterQuery() {
  const {
    state: {
      terms: {filter},
    },
  } = useSearchState()

  if (!filter) {
    return null
  }

  return (
    <Card padding={4} tone="transparent">
      <VStack gap={3}>
        <Code
          size={1}
          style={{
            fontWeight: 'var(--medium)',
          }}
          trim
        >
          Filter
        </Code>
        {filter && (
          <Code size={1} style={{whiteSpace: 'normal'}} trim>
            {filter}
          </Code>
        )}
      </VStack>
    </Card>
  )
}
