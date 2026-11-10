import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type BlockProps} from '../../../../types/blockProps'
import {DefaultComponent} from '../TextBlock'

/**
 * `TextBlock` hands `DefaultComponent` to the block's `renderDefault`; a
 * `components.block` that just calls it keeps the stock text block render
 * while this file imports the module it archives.
 */
function DefaultTextBlock(props: BlockProps) {
  return <DefaultComponent {...props} />
}

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
        of: [defineArrayMember({type: 'block', components: {block: DefaultTextBlock}})],
      }),
    ],
  }),
]

function block(
  key: string,
  text: string,
  options: {style?: string; listItem?: 'bullet' | 'number'; level?: number} = {},
) {
  return {
    _type: 'block',
    _key: key,
    children: [{_type: 'span', _key: `${key}-s`, text, marks: []}],
    markDefs: [],
    style: options.style ?? 'normal',
    ...(options.listItem ? {listItem: options.listItem, level: options.level ?? 1} : {}),
  }
}

const BLOCKS = [
  block('h2', 'A heading', {style: 'h2'}),
  block('p1', 'A normal paragraph with enough words to wrap onto a second line in the editor.'),
  block('q', 'A quote block, with its border down the left edge.', {style: 'blockquote'}),
  block('b1', 'First bullet', {listItem: 'bullet'}),
  block('b2', 'Nested bullet', {listItem: 'bullet', level: 2}),
  block('n1', 'First numbered item', {listItem: 'number'}),
  block('h4', 'A smaller heading', {style: 'h4'}),
]

const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '123',
  body: BLOCKS,
}

function TextBlockHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('TextBlock', () => {
  it('renders headings, a quote and list items with their prefixes', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<TextBlockHarness />)

    const $field = page.getByTestId('field-body')
    await expect.element($field.getByText('A smaller heading')).toBeVisible()

    const blocks = $field.element().querySelectorAll('[data-testid="text-block"]')
    expect(blocks).toHaveLength(BLOCKS.length)

    const texts = $field.element().querySelectorAll('[data-testid="text-block__text"]')
    expect(Array.from(texts, (el) => el.getAttribute('data-list-item'))).toEqual(
      BLOCKS.map((item) => item.listItem ?? null),
    )
    expect($field.element().querySelectorAll('[data-list-prefix]')).toHaveLength(3)
    await expect.element($field.getByRole('heading', {level: 2, name: 'A heading'})).toBeVisible()
    await expect
      .element($field.getByRole('heading', {level: 4, name: 'A smaller heading'}))
      .toBeVisible()
    expect($field.element().querySelector('blockquote')?.textContent).toBe(
      'A quote block, with its border down the left edge.',
    )

    await settleChromaticEndState()
    await expect.element($field.getByText('A heading')).toBeVisible()
  })
})
