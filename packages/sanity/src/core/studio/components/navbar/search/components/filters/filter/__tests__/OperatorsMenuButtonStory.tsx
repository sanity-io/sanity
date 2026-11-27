import {type SchemaTypeDefinition} from '@sanity/types'
import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../../../contexts/search/SearchProvider'
import {booleanOperators} from '../../../../definitions/operators/booleanOperators'
import {type SearchFilter} from '../../../../types'
import {OperatorsMenuButton} from '../OperatorsMenuButton'

const SCHEMA_TYPES: SchemaTypeDefinition[] = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'boolean'}],
  },
]

const BOOLEAN_FILTER: SearchFilter = {
  fieldId: 'boolean-title-Title',
  filterName: 'boolean',
  operatorType: 'booleanEqual',
  value: true,
}

/**
 * Chromatic sentinel for the search filter operators menu after the ui5
 * migration. SearchProvider supplies the boolean filter definition (is /
 * empty). Play opens the menu so the snapshot is the portaled list, not
 * just the ghost trigger. Studio locale copy; no live search.
 */
export function OperatorsMenuButtonStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{minHeight: 240}}>
        <SearchProvider>
          <OperatorsMenuButton filter={BOOLEAN_FILTER} operator={booleanOperators.booleanEqual} />
        </SearchProvider>
      </Card>
    </TestWrapper>
  )
}
