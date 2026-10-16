import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'tags',
        title: 'Tags',
        of: [{type: 'string'}],
        options: {layout: 'tags'},
      }),
    ],
  }),
]

function ArrayInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}

describe('Tag layout', () => {
  it('Pressing enter should create inline tags', async () => {
    const {typeWithDelay} = testHelpers()
    void render(<ArrayInputHarness />)
    const $field = page.getByTestId('field-tags')
    await expect.element($field).toBeVisible()
    const textbox = $field.getByRole('textbox')
    await textbox.element().focus()

    await typeWithDelay('abc')
    await userEvent.keyboard('{Enter}')
    await typeWithDelay('123')
    await userEvent.keyboard('{Enter}')

    // Check tags are created
    await expect.element(page.getByText('abc')).toBeVisible()
    await expect.element(page.getByText('123')).toBeVisible()
  })
})
