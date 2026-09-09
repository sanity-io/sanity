import {defineField, defineType} from '@sanity/types'
import {type ComponentType, lazy} from 'react'
import {type ObjectInputProps, type SchemaTypeDefinition} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

type RootInput = ComponentType<ObjectInputProps>

const PendingRootInput = lazy<RootInput>(() => new Promise(() => {}))

const FIELDS = [
  defineField({type: 'string', name: 'title', title: 'Title'}),
  defineField({type: 'string', name: 'subtitle', title: 'Subtitle'}),
  defineField({type: 'string', name: 'author', title: 'Author'}),
  defineField({type: 'text', name: 'body', title: 'Body'}),
]

function schema(input?: RootInput): SchemaTypeDefinition[] {
  return [
    defineType({
      type: 'document',
      name: 'test',
      title: 'Test',
      fields: FIELDS,
      components: input ? {input} : undefined,
    }),
  ]
}

const PANE_STYLE = {width: 560, height: 640, position: 'relative'} as const

/** The same document form twice: a root input that never loads, and the loaded form. */
function PendingNextToLoadedHarness() {
  return (
    <div style={{display: 'flex', gap: 24, padding: 24}}>
      <div data-testid="pending-pane" style={PANE_STYLE}>
        <TestWrapper schemaTypes={schema(PendingRootInput)}>
          <TestForm />
        </TestWrapper>
      </div>
      <div data-testid="loaded-pane" style={PANE_STYLE}>
        <TestWrapper schemaTypes={schema()}>
          <TestForm />
        </TestWrapper>
      </div>
    </div>
  )
}

function rows(pane: HTMLElement, selector: string) {
  const paneTop = pane.getBoundingClientRect().top
  return [...pane.querySelectorAll<HTMLElement>(selector)].map((element) => {
    const rect = element.getBoundingClientRect()
    return {top: Math.round(rect.top - paneTop), height: Math.round(rect.height)}
  })
}

const FIELD_ROOTS = FIELDS.map((field) => `[data-testid="field-${field.name}"]`).join(', ')

describe('FormInputFallback', () => {
  it('lays out one field placeholder per field where the loaded field rows are', async () => {
    void render(<PendingNextToLoadedHarness />)
    await expect.element(page.getByTestId('loaded-pane').getByTestId('field-body')).toBeVisible()
    await expect
      .element(page.getByTestId('pending-pane').getByTestId('form-object-input-skeleton'))
      .toBeVisible()

    const pending = rows(
      page.getByTestId('pending-pane').element() as HTMLElement,
      '[data-testid="form-field-skeleton"]',
    )
    const loaded = rows(page.getByTestId('loaded-pane').element() as HTMLElement, FIELD_ROOTS)

    expect(pending).toHaveLength(loaded.length)
    for (const [index, row] of loaded.entries()) {
      expect(Math.abs(pending[index].top - row.top)).toBeLessThanOrEqual(2)
    }
    // The placeholder is one text input tall; the `text` field's textarea is taller by design.
    for (const [index, row] of loaded.slice(0, 3).entries()) {
      expect(Math.abs(pending[index].height - row.height)).toBeLessThanOrEqual(2)
    }
  })
})
