import {type SchemaValidationProblemGroup} from '@sanity/types'
import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {SchemaProblemGroups} from '../SchemaProblemGroups'

const PROBLEM_GROUPS: SchemaValidationProblemGroup[] = [
  {
    path: [{kind: 'type', type: 'document', name: 'article'}],
    problems: [
      {
        severity: 'error',
        message: 'Field "title" is required but missing from the schema definition.',
      },
    ],
  },
  {
    path: [
      {kind: 'type', type: 'object', name: 'seo'},
      {kind: 'property', name: 'description'},
    ],
    problems: [
      {
        severity: 'warning',
        message: 'Deprecated preview.select.subtitle — use preview.select.media instead.',
      },
    ],
  },
]

/**
 * Chromatic sentinel for schema validation cards after the ui5 Box
 * migration. Critical vs caution tones sit next to Box icon/path padding;
 * a token drift here would hide boot-blocking schema errors. Messages and
 * paths are fixtures (no generated help URLs, no timestamps).
 */
export function SchemaProblemGroupsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 520}}>
        <SchemaProblemGroups problemGroups={PROBLEM_GROUPS} />
      </Card>
    </TestWrapper>
  )
}
