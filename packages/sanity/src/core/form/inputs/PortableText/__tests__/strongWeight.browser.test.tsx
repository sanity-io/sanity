import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

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
        name: 'body',
        title: 'Body',
        of: [defineArrayMember({type: 'block'})],
      }),
    ],
  }),
]

function block(
  key: string,
  style: string,
  children: Array<{key: string; text: string; strong?: boolean}>,
) {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: children.map((child) => ({
      _type: 'span',
      _key: child.key,
      text: child.text,
      marks: child.strong ? ['strong'] : [],
    })),
  }
}

const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '123',
  body: [
    block('p1', 'normal', [
      {key: 's1', text: 'Regular text and '},
      {key: 's2', text: 'bold text', strong: true},
      {key: 's3', text: ' side by side.'},
    ]),
    block('h2', 'h2', [
      {key: 's4', text: 'Heading with '},
      {key: 's5', text: 'bold words', strong: true},
    ]),
  ],
}

/**
 * Studio chrome sets `strong, b { font-weight: 500 }` in GlobalStyle. The test
 * repeats that rule so the editor mark has to win on its own.
 */
function StrongWeightHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <style>{'strong, b { font-weight: 500; }'}</style>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

function fontWeight(element: Element): number {
  return Number(getComputedStyle(element).fontWeight)
}

describe('Portable Text strong decorator', () => {
  it('renders body bold heavier than regular text, and heading bold no lighter than the heading', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<StrongWeightHarness />)

    const field = page.getByTestId('field-body')
    await expect.element(field.getByText('bold text', {exact: true})).toBeVisible()
    await expect.element(field.getByRole('heading', {level: 2})).toBeVisible()

    const bodyStrong = field.element().querySelector('[data-mark="strong"]')
    const bodyParent = bodyStrong?.parentElement
    const heading = field.element().querySelector('h2')
    const headingStrong = heading?.querySelector('[data-mark="strong"]')
    if (!bodyStrong || !bodyParent || !heading || !headingStrong) {
      throw new Error('missing strong marks')
    }

    const bodyWeight = fontWeight(bodyStrong)
    const bodyParentWeight = fontWeight(bodyParent)
    expect(bodyWeight).toBe(700)
    expect(bodyWeight).toBeGreaterThan(bodyParentWeight)

    const headingWeight = fontWeight(heading)
    const headingStrongWeight = fontWeight(headingStrong)
    expect(headingStrongWeight).toBeGreaterThanOrEqual(headingWeight)
    expect(headingStrongWeight).toBeGreaterThan(500)

    await settleChromaticEndState()
    await expect.element(field.getByText('bold text', {exact: true})).toBeVisible()
  })
})
