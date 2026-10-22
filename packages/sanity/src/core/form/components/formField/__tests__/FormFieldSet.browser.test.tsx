import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

const DOCUMENT: SanityDocument = {
  _id: 'form-field-set',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'form-field-set-rev',
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fieldsets: [{name: 'seo', title: 'SEO', options: {collapsible: true, collapsed: true}}],
    fields: [
      defineField({
        type: 'object',
        name: 'details',
        title: 'Details',
        options: {collapsible: true, collapsed: true},
        fields: [defineField({type: 'string', name: 'summary', title: 'Summary'})],
      }),
      defineField({type: 'string', name: 'metaTitle', title: 'Meta title', fieldset: 'seo'}),
    ],
  }),
]

function FormFieldSetHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('FormFieldSet', () => {
  test.each([
    {kind: 'collapsible object field', title: 'Details', child: 'Summary'},
    {kind: 'collapsible fieldset', title: 'SEO', child: 'Meta title'},
  ])('toggles a $kind from the empty space beside its title', async ({title, child}) => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FormFieldSetHarness />)

    const toggle = page.getByRole('button', {name: title, exact: true})
    const childField = page.getByText(child, {exact: true})
    await expect.element(toggle).toBeVisible()
    await expect.element(childField).not.toBeInTheDocument()

    const headerRow = toggle.element().closest('legend')?.parentElement
    if (!headerRow) throw new Error('Expected the legend to sit in a header row')
    const rowRect = headerRow.getBoundingClientRect()
    const toggleRect = toggle.element().getBoundingClientRect()
    // Well clear of the title text, in the row's empty space
    const position = {
      x: Math.round(toggleRect.right - rowRect.left + (rowRect.right - toggleRect.right) / 2),
      y: Math.round(rowRect.height / 2),
    }
    expect(position.x).toBeGreaterThan(toggleRect.width + 100)

    const row = page.elementLocator(headerRow)
    await row.click({position})
    await expect.element(childField).toBeVisible()

    await row.click({position})
    await expect.element(childField).not.toBeInTheDocument()

    await settleChromaticEndState()
  })
})
