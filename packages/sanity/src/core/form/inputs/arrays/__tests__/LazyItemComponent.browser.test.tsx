import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentType, lazy} from 'react'
import {definePlugin, type ItemProps, type PluginOptions} from 'sanity'
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
      defineField({
        type: 'array',
        name: 'reviews',
        title: 'Reviews',
        of: [
          {
            type: 'object',
            name: 'review',
            fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
          },
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
  reviews: [
    {_type: 'review', _key: 'first', title: 'First review'},
    {_type: 'review', _key: 'second', title: 'Second review'},
  ],
}

function PassThroughItem(props: ItemProps) {
  return props.renderDefault(props)
}

let resolveItem: (module: {default: ComponentType<ItemProps>}) => void = () => {}
// Stays pending until the test resolves it, like a plugin's `lazy()` item component that has no
// `<Suspense>` of its own while its chunk downloads.
const LazyItem = lazy(
  () =>
    new Promise<{default: ComponentType<ItemProps>}>((resolve) => {
      resolveItem = resolve
    }),
)

const PLUGINS: PluginOptions[] = [
  definePlugin({name: 'lazy-item', form: {components: {item: LazyItem}}})(),
]

function LazyItemHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES} plugins={PLUGINS}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

/** Counts fallback mounts from now on; the fallback is already showing when this starts. */
function countFallbackMounts(durationMs: number): Promise<number> {
  let mounts = 0
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (
          node instanceof HTMLElement &&
          (node.matches('[data-testid="loading-block"]') ||
            node.querySelector('[data-testid="loading-block"]'))
        ) {
          mounts++
        }
      }
    }
  })
  observer.observe(document.body, {childList: true, subtree: true})
  return new Promise((resolve) => {
    setTimeout(() => {
      observer.disconnect()
      resolve(mounts)
    }, durationMs)
  })
}

describe('lazy item component', () => {
  it('suspends the form once until the item loads, without hiding and re-showing it in a loop', async () => {
    void render(<LazyItemHarness />)

    // Array items mount only after the virtualizer has measured its scroll element, so the lazy
    // item suspends a form that has already committed. The form's boundary hides it and shows
    // its loading block.
    const fallback = page.getByTestId('loading-block')
    await expect.element(fallback).toBeVisible()
    await expect.element(page.getByTestId('field-reviews')).not.toBeVisible()

    // The hidden array container reports zero width. Unmounting the list on that reading would
    // drop the pending item, re-show the form, remount the list and suspend again every frame.
    expect(await countFallbackMounts(500)).toBe(0)
    await expect.element(fallback).toBeVisible()

    resolveItem({default: PassThroughItem})

    await expect.element(page.getByText('First review')).toBeVisible()
    await expect.element(page.getByText('Second review')).toBeVisible()
    await expect.element(fallback).not.toBeInTheDocument()
  })
})
