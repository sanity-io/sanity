import {configure} from '@chromatic-com/vitest'
import {
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
  type SanityDocument,
} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useState} from 'react'
import {useSchema} from 'sanity'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {focusFirstFormInput} from '../focusFirstFormInput'
import {FormHeader} from '../FormHeader'

configure({disableAutoSnapshot: true})

const DOCUMENT: SanityDocument = {
  _id: 'focus-test',
  _type: 'test',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  _rev: 'focus-test-rev',
}

// `TestForm` renders the schema type named `test`.
const TYPES = {
  withHeader: defineType({
    type: 'document',
    name: 'test',
    title: 'With header',
    description: 'Explains what this document is for',
    preview: {select: {title: 'title'}},
    fields: [
      defineField({type: 'string', name: 'title', title: 'Title'}),
      defineField({type: 'string', name: 'subtitle', title: 'Subtitle'}),
    ],
  }),
  plain: defineType({
    type: 'document',
    name: 'test',
    title: 'Plain',
    fields: [
      defineField({type: 'string', name: 'name', title: 'Name'}),
      defineField({type: 'string', name: 'other', title: 'Other'}),
    ],
  }),
  readOnlyFirst: defineType({
    type: 'document',
    name: 'test',
    title: 'Read-only first',
    fields: [
      defineField({type: 'string', name: 'locked', title: 'Locked', readOnly: true}),
      defineField({type: 'string', name: 'editable', title: 'Editable'}),
    ],
  }),
  collapsedFieldsetFirst: defineType({
    type: 'document',
    name: 'test',
    title: 'Collapsed fieldset first',
    fieldsets: [{name: 'meta', title: 'Meta', options: {collapsible: true, collapsed: true}}],
    fields: [
      defineField({type: 'string', name: 'inMeta', title: 'In meta', fieldset: 'meta'}),
      defineField({type: 'string', name: 'afterMeta', title: 'After meta'}),
    ],
  }),
  grouped: defineType({
    type: 'document',
    name: 'test',
    title: 'Grouped',
    groups: [
      {name: 'content', title: 'Content', default: true},
      {name: 'seo', title: 'SEO'},
    ],
    fields: [
      defineField({type: 'string', name: 'seoTitle', title: 'SEO title', group: 'seo'}),
      defineField({type: 'string', name: 'heading', title: 'Heading', group: 'content'}),
    ],
  }),
  nestedObjectFirst: defineType({
    type: 'document',
    name: 'test',
    title: 'Nested object first',
    fields: [
      defineField({
        type: 'object',
        name: 'address',
        title: 'Address',
        fields: [defineField({type: 'string', name: 'street', title: 'Street'})],
      }),
    ],
  }),
  arrayFirst: defineType({
    type: 'document',
    name: 'test',
    title: 'Array first',
    fields: [
      defineField({
        type: 'array',
        name: 'tags',
        title: 'Tags',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'tag',
            fields: [{type: 'string', name: 'label'}],
          }),
        ],
      }),
      defineField({type: 'string', name: 'afterArray', title: 'After array'}),
    ],
  }),
  portableTextFirst: defineType({
    type: 'document',
    name: 'test',
    title: 'Portable Text first',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        title: 'Body',
        of: [defineArrayMember({type: 'block'})],
      }),
      defineField({type: 'string', name: 'afterBody', title: 'After body'}),
    ],
  }),
}

/** The document form as `FormView` lays it out: the header, then the form builder. */
function DocumentForm(props: {
  interactiveTitle?: boolean
  readOnly?: boolean
  onForm: (form: HTMLFormElement | null) => void
}) {
  const {interactiveTitle, readOnly, onForm} = props
  const schemaType = useSchema().get('test') as ObjectSchemaType
  return (
    <form ref={onForm} onSubmit={noop}>
      <FormHeader
        documentId={DOCUMENT._id}
        schemaType={schemaType}
        title="Letters from the North Ridge"
        onTitleClick={interactiveTitle ? noop : undefined}
      />
      <TestForm document={DOCUMENT} readOnly={readOnly} />
    </form>
  )
}

async function renderDocumentForm(
  type: keyof typeof TYPES,
  options: {interactiveTitle?: boolean; readOnly?: boolean} = {},
): Promise<HTMLFormElement> {
  let form: HTMLFormElement | null = null
  function Harness(): ReactNode {
    const [, setForm] = useState<HTMLFormElement | null>(null)
    return (
      <TestWrapper schemaTypes={[TYPES[type]]}>
        <DocumentForm
          {...options}
          onForm={(node) => {
            form = node
            setForm(node)
          }}
        />
      </TestWrapper>
    )
  }
  await render(<Harness />)
  await expect.poll(() => form?.querySelector('[data-testid^="field-"]')).toBeTruthy()
  return form!
}

describe('focusFirstFormInput', () => {
  test('passes over an interactive title and the field actions to the first input', async () => {
    const form = await renderDocumentForm('withHeader', {interactiveTitle: true})
    await expect
      .element(page.getByRole('button', {name: 'Letters from the North Ridge'}))
      .toBeVisible()

    expect(focusFirstFormInput(form)).toBe(true)
    await expect.element(page.getByTestId('field-title').getByRole('textbox')).toHaveFocus()
  })

  test('lands on the first input when the form has no interactive title or description', async () => {
    const form = await renderDocumentForm('plain')
    expect(form.querySelector('[data-skip-initial-focus] button')).not.toBeNull()

    expect(focusFirstFormInput(form)).toBe(true)
    await expect.element(page.getByTestId('field-name').getByRole('textbox')).toHaveFocus()
  })

  test('skips a read-only field for the first editable one', async () => {
    const form = await renderDocumentForm('readOnlyFirst')

    expect(focusFirstFormInput(form)).toBe(true)
    await expect.element(page.getByTestId('field-editable').getByRole('textbox')).toHaveFocus()
  })

  test('starts on the first read-only input when nothing in the form is editable', async () => {
    const form = await renderDocumentForm('plain', {readOnly: true})

    expect(focusFirstFormInput(form)).toBe(true)
    await expect.element(page.getByTestId('field-name').getByRole('textbox')).toHaveFocus()
  })

  test('skips a collapsed fieldset, whose inputs are not rendered', async () => {
    const form = await renderDocumentForm('collapsedFieldsetFirst')

    expect(focusFirstFormInput(form)).toBe(true)
    await expect.element(page.getByTestId('field-afterMeta').getByRole('textbox')).toHaveFocus()
  })

  test('lands in the selected field group, not on its tab', async () => {
    const form = await renderDocumentForm('grouped')
    await expect.element(page.getByTestId('group-tab-content')).toBeVisible()

    expect(focusFirstFormInput(form)).toBe(true)
    await expect.element(page.getByTestId('field-heading').getByRole('textbox')).toHaveFocus()
  })

  test('descends into a nested object instead of focusing its wrapper', async () => {
    const form = await renderDocumentForm('nestedObjectFirst')

    expect(focusFirstFormInput(form)).toBe(true)
    await expect
      .element(page.getByTestId('field-address.street').getByRole('textbox'))
      .toHaveFocus()
  })

  test('lands on the array input when the first field is an array', async () => {
    const form = await renderDocumentForm('arrayFirst')

    expect(focusFirstFormInput(form)).toBe(true)
    // The array input's own focus target, the element a `tags` focus path focuses.
    expect(form.ownerDocument.activeElement).toBe(form.querySelector('#tags'))
  })

  test('lands in the editor when the first field is Portable Text', async () => {
    const form = await renderDocumentForm('portableTextFirst')
    await expect.element(page.getByTestId('field-body').getByRole('textbox')).toBeVisible()

    expect(focusFirstFormInput(form)).toBe(true)
    await expect.element(page.getByTestId('field-body').getByRole('textbox')).toHaveFocus()
  })

  test('returns false while nothing in the form can take focus', () => {
    const form = document.createElement('form')
    document.body.append(form)
    expect(focusFirstFormInput(form)).toBe(false)
    form.remove()
  })

  test('passes over an inactive Portable Text activate overlay to the editable', () => {
    const form = document.createElement('form')
    form.innerHTML = `
      <div data-testid="activate-overlay" data-skip-initial-focus tabindex="0">Click to activate</div>
      <div contenteditable="true" role="textbox" data-testid="pt-editable"></div>
    `
    document.body.append(form)

    expect(focusFirstFormInput(form)).toBe(true)
    expect(form.ownerDocument.activeElement).toBe(form.querySelector('[data-testid="pt-editable"]'))
    form.remove()
  })

  test('focuses a wrapper whose only descendants are skip-marked chrome', () => {
    const form = document.createElement('form')
    form.innerHTML = `
      <div tabindex="0" data-testid="object-wrapper">
        <div data-skip-initial-focus>
          <button type="button">Field actions</button>
        </div>
      </div>
    `
    document.body.append(form)

    expect(focusFirstFormInput(form)).toBe(true)
    expect(form.ownerDocument.activeElement).toBe(
      form.querySelector('[data-testid="object-wrapper"]'),
    )
    form.remove()
  })
})
