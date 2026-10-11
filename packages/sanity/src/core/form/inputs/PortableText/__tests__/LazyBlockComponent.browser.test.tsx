import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentType, lazy} from 'react'
import {type BlockProps, definePlugin, type InputProps, type PluginOptions} from 'sanity'
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

function PassThrough<Props extends {renderDefault: (props: Props) => React.JSX.Element}>(
  props: Props,
) {
  return props.renderDefault(props)
}

// Stays pending until the test resolves it, like a plugin's `lazy()` component that has no
// `<Suspense>` of its own while its chunk downloads.
function pendingComponent<Props extends {renderDefault: (props: Props) => React.JSX.Element}>() {
  let resolve: (module: {default: ComponentType<Props>}) => void = () => {}
  const Lazy = lazy(
    () =>
      new Promise<{default: ComponentType<Props>}>((res) => {
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
    const block = pendingComponent<BlockProps>()
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
    const inlineBlock = pendingComponent<BlockProps>()
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

  it('keeps a block object edit modal open while a lazy input inside it loads', async () => {
    const {getFocusedPortableTextInput} = testHelpers()
    const input = pendingComponent<InputProps>()
    // Lazy only for inputs inside the editor's objects, so the form itself renders and the
    // suspension happens where the modal shows the object's fields.
    function InsideObjectInput(props: InputProps) {
      return props.path.length > 2 ? <input.Lazy {...props} /> : props.renderDefault(props)
    }
    void render(
      <Harness
        plugins={[
          definePlugin({
            name: 'lazy-object-input',
            form: {components: {input: InsideObjectInput}},
          })(),
        ]}
      />,
    )

    await getFocusedPortableTextInput('field-body')
    await page.getByRole('button', {name: 'Insert Callout (block)'}).first().click()

    // The modal owns the boundary: it stays open with its own loading block, and the block that
    // opened it is not swapped for the block fallback.
    const dialog = page.getByTestId('nested-object-dialog')
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByTestId('loading-block')).toBeVisible()
    expect(countTestIds('block-object-fallback')()).toBe(0)
    await expect.poll(countTestIds('pte-block-object')).toBe(2)

    input.resolve()

    await expect.element(dialog.getByTestId('string-input')).toBeVisible()
    await expect.element(dialog.getByTestId('loading-block')).not.toBeInTheDocument()
  })
})
