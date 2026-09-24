import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentType, lazy} from 'react'
import {type BlockProps, definePlugin, type PluginOptions} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({type: 'string', name: 'title', title: 'Title'}),
      defineField({
        type: 'array',
        name: 'body',
        title: 'Body',
        of: [
          defineArrayMember({
            type: 'block',
            of: [
              {
                type: 'object',
                name: 'icon',
                title: 'Icon',
                fields: [defineField({type: 'string', name: 'name', title: 'Name'})],
                preview: {select: {title: 'name'}},
              },
            ],
          }),
          defineArrayMember({
            type: 'object',
            name: 'callout',
            title: 'Callout',
            fields: [defineField({type: 'string', name: 'text', title: 'Text'})],
            preview: {select: {title: 'text'}},
          }),
        ],
      }),
    ],
  }),
]

const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '123',
  title: 'Lazy blocks',
  body: [
    {
      _type: 'block',
      _key: 'first',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 'first-span', text: 'First paragraph', marks: []}],
    },
    {
      _type: 'block',
      _key: 'second',
      style: 'normal',
      markDefs: [],
      children: [
        {_type: 'span', _key: 'second-span', text: 'Second paragraph with an ', marks: []},
        {_type: 'icon', _key: 'inline-icon', name: 'Rocket'},
        {_type: 'span', _key: 'second-span-after', text: ' inline object', marks: []},
      ],
    },
    {_type: 'callout', _key: 'callout', text: 'A block object'},
    {
      _type: 'block',
      _key: 'third',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 'third-span', text: 'Third paragraph', marks: []}],
    },
  ],
}

function PassThrough(props: BlockProps) {
  return props.renderDefault(props)
}

// Stays pending until the test resolves it, like a plugin's `lazy()` component that has no
// `<Suspense>` of its own while its chunk downloads.
function pendingComponent() {
  let resolve: (module: {default: ComponentType<BlockProps>}) => void = () => {}
  const Lazy = lazy(
    () =>
      new Promise<{default: ComponentType<BlockProps>}>((res) => {
        resolve = res
      }),
  )
  return {Lazy, resolve: () => resolve({default: PassThrough})}
}

function Harness(props: {plugins: PluginOptions[]}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES} plugins={props.plugins}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

const countTestIds = (testId: string) => () =>
  document.querySelectorAll(`[data-testid="${testId}"]`).length

describe('lazy Portable Text components', () => {
  it('gives every top-level block its own boundary, so the form and the editor stay visible', async () => {
    const block = pendingComponent()
    void render(
      <Harness
        plugins={[definePlugin({name: 'lazy-block', form: {components: {block: block.Lazy}}})()]}
      />,
    )

    // Three text blocks and one block object, each behind its own fallback, inside an editor
    // that is otherwise in place; nothing suspended up to the form.
    await expect.poll(countTestIds('text-block-fallback')).toBe(3)
    await expect.poll(countTestIds('block-object-fallback')).toBe(1)
    await expect.element(page.getByTestId('field-title')).toBeVisible()
    await expect.element(page.getByTestId('field-body')).toBeVisible()
    expect(countTestIds('loading-block')()).toBe(0)

    block.resolve()

    await expect.element(page.getByText('First paragraph')).toBeVisible()
    await expect.element(page.getByText('Third paragraph')).toBeVisible()
    await expect.element(page.getByText('A block object')).toBeVisible()
    await expect.poll(countTestIds('text-block-fallback')).toBe(0)
    await expect.poll(countTestIds('block-object-fallback')).toBe(0)
  })

  it('holds up only the block that contains a lazy inline object', async () => {
    const inlineBlock = pendingComponent()
    void render(
      <Harness
        plugins={[
          definePlugin({
            name: 'lazy-inline-block',
            form: {components: {inlineBlock: inlineBlock.Lazy}},
          })(),
        ]}
      />,
    )

    // The inline object suspends up to its text block's boundary; the blocks around it render.
    await expect.poll(countTestIds('text-block-fallback')).toBe(1)
    await expect.element(page.getByText('First paragraph')).toBeVisible()
    await expect.element(page.getByText('Third paragraph')).toBeVisible()
    await expect.element(page.getByText('A block object')).toBeVisible()
    await expect.element(page.getByText('Second paragraph with an')).not.toBeInTheDocument()

    inlineBlock.resolve()

    await expect.element(page.getByText('Rocket')).toBeVisible()
    await expect.element(page.getByText('Second paragraph with an')).toBeVisible()
    await expect.poll(countTestIds('text-block-fallback')).toBe(0)
  })
})
