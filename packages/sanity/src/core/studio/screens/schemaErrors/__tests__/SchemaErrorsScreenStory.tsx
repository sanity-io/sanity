import {type Schema, type SchemaValidationProblemGroup} from '@sanity/types'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type SchemaErrorContext} from '../../../../config/SchemaError'
import {SchemaErrorsScreen} from '../SchemaErrorsScreen'

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
      {kind: 'property', name: 'fields'},
      {kind: 'type', type: 'reference', name: 'openGraphImage'},
    ],
    problems: [
      {
        severity: 'error',
        message: 'Reference type must define at least one type in "to".',
        helpId: 'schema-reference-to-required',
      },
    ],
  },
]

// Only `_validation` is read: the screen filters it to groups with errors and
// reports the (absent) warnings to the console. A real compiled schema is not
// needed to paint the boot-blocking layout.
const SCHEMA = {_validation: PROBLEM_GROUPS} as unknown as Schema

/**
 * Chromatic sentinel for the full-screen schema errors takeover after the
 * ui5 VStack migration. The heading row (title + "Copy to clipboard"), the
 * optional error location card and the problem list stack in one VStack
 * inside a width-1 Container — the gaps between them are what this pins; the
 * cards themselves are the `SchemaProblemGroups` story's job. Two error
 * groups, one with a `helpId`; messages and paths are fixtures (no live
 * schema compile, no timestamps).
 *
 * The screen renders from an error boundary that can sit either side of
 * LocaleProvider, so every label carries an inline default; TestWrapper
 * mounts no LocaleProvider, so this pins the untranslated path.
 */
export function SchemaErrorsScreenStory(props: {context?: SchemaErrorContext}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <SchemaErrorsScreen schema={SCHEMA} context={props.context} />
    </TestWrapper>
  )
}
