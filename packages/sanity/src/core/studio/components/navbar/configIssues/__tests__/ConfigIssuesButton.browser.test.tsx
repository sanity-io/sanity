import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ConfigIssuesButton} from '../ConfigIssuesButton'

// Schema compilation records a warning (not an error) when an inline array
// member reuses the name of a global document type, which is the kind of
// problem the button surfaces.
const SCHEMA_TYPES = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
  defineType({
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      defineField({name: 'title', type: 'string'}),
      defineField({
        name: 'contributors',
        type: 'array',
        of: [
          defineArrayMember({
            name: 'author',
            type: 'object',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
        ],
      }),
    ],
  }),
]

function ConfigIssuesButtonHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <ConfigIssuesButton />
    </TestWrapper>
  )
}

/**
 * Visual coverage for the navbar's configuration issues button and dialog: the
 * caution-tone status button that only exists while the schema has warnings,
 * and the open dialog with the warning count, the development-only note and
 * the schema problem groups.
 */
describe('ConfigIssuesButton', () => {
  test('opens the configuration issues dialog listing the schema warning', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<ConfigIssuesButtonHarness />)

    const trigger = page.getByRole('button', {name: 'Configuration issues'})
    await expect.element(trigger).toBeVisible()
    await userEvent.click(trigger)

    await expect.element(page.getByText('Found 1 configuration warning')).toBeVisible()
    await expect
      .element(page.getByText(/same name as the global schema type "author"/))
      .toBeVisible()

    await settleChromaticEndState()
  })
})
