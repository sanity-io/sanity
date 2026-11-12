import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

const DOCUMENT: SanityDocument = {
  _id: 'fieldset-collapse',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'fieldset-collapse-rev',
  info: {_type: 'object', title: 'Hello'},
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fieldsets: [
      {
        name: 'meta',
        title: 'Group label',
        options: {collapsible: true, collapsed: false},
      },
    ],
    fields: [
      defineField({
        name: 'info',
        title: 'Collapsible object',
        type: 'object',
        fieldset: 'meta',
        options: {collapsible: true, collapsed: false},
        fields: [defineField({name: 'title', type: 'string', title: 'Title'})],
      }),
    ],
  }),
]

function Harness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

function intersects(a: DOMRect, b: DOMRect): boolean {
  return (
    a.left < b.right - 0.5 &&
    a.right > b.left + 0.5 &&
    a.top < b.bottom - 0.5 &&
    a.bottom > b.top + 0.5
  )
}

function legendRows() {
  return Array.from(document.querySelectorAll('legend button')).map((button) => {
    const glyph = button.querySelector('path')?.getBoundingClientRect()
    const label = Array.from(button.querySelectorAll('[data-ui="Text"]')).find(
      (element) => !element.querySelector('svg'),
    )
    return {
      label: label?.textContent ?? '',
      glyph,
      labelBox: label?.getBoundingClientRect(),
    }
  })
}

describe('collapsible object inside a fieldset', () => {
  test('keeps the collapse control clear of the group label', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<Harness />)

    await expect.element(page.getByRole('button', {name: 'Group label'})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Collapsible object'})).toBeVisible()
    await settleChromaticEndState()

    const rows = legendRows()
    const group = rows.find((row) => row.label === 'Group label')
    const object = rows.find((row) => row.label === 'Collapsible object')

    expect(group?.glyph, 'group chevron').toBeTruthy()
    expect(group?.labelBox, 'group label').toBeTruthy()
    expect(object?.glyph, 'object chevron').toBeTruthy()
    expect(object?.labelBox, 'object label').toBeTruthy()
    if (!group?.glyph || !group.labelBox || !object?.glyph || !object.labelBox) return

    expect(intersects(group.glyph, group.labelBox)).toBe(false)
    expect(intersects(object.glyph, object.labelBox)).toBe(false)
    expect(intersects(object.glyph, group.labelBox)).toBe(false)
  })
})
