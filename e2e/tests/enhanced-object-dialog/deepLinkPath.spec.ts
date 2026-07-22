import {expect} from '@playwright/test'
import {type SanityDocument} from '@sanity/client'

import {test as base} from '../../studio-test'

/**
 * Regression tests for opening edit intent links with a nested `path` param —
 * the URLs produced by "Open in Studio" links in Visual Editing overlays.
 *
 * The initial focus path must be applied once the document form is ready so
 * that collapsed ancestors (collapsible objects, fieldsets, field groups) are
 * expanded and nested object dialogs are opened.
 *
 * See https://github.com/sanity-io/sanity/issues/12805
 */
const test = base.extend<{collapsibleDoc: SanityDocument; nestedArrayDoc: SanityDocument}>({
  collapsibleDoc: async ({sanityClient}, fnUse) => {
    const doc = await sanityClient.create({
      _type: 'collapsibleObjects',
      name: 'Deep link e2e fixture',
      // `simple` is configured with `options: {collapsed: true}` in the schema
      simple: {name: 'Deep link target'},
    })
    await fnUse(doc)
    await sanityClient.delete(doc._id)
  },
  nestedArrayDoc: async ({sanityClient}, fnUse) => {
    const doc = await sanityClient.create({
      _type: 'objectsDebug',
      title: 'Deep link e2e fixture',
      objectWithArray: {
        animalss: [{_key: 'k1', _type: 'animal', name: 'Cat'}],
      },
    })
    await fnUse(doc)
    await sanityClient.delete(doc._id)
  },
})

test.describe('Edit intent links with a nested path param', () => {
  test('expands a collapsed collapsible object to reveal the target field', async ({
    page,
    collapsibleDoc,
  }) => {
    await page.goto(
      `/intent/edit/id=${collapsibleDoc._id};type=collapsibleObjects;path=${encodeURIComponent('simple.name')}`,
    )

    await expect(page.getByTestId('form-view')).toBeVisible({timeout: 40_000})

    // Before the fix the `simple` object stayed collapsed, so the nested
    // `name` field never rendered.
    const nestedInput = page.getByTestId('field-simple.name').getByTestId('string-input')
    await expect(nestedInput).toBeVisible()
    await expect(nestedInput).toHaveValue('Deep link target')
  })

  test('opens the nested object dialog for an array item field in presentation', async ({
    page,
    nestedArrayDoc,
  }) => {
    const path = encodeURIComponent('objectWithArray.animalss[_key=="k1"].name')

    // `mode=presentation` routes the intent to the presentation tool, like
    // "Open in Studio" links do
    await page.goto(
      `/intent/edit/mode=presentation;id=${nestedArrayDoc._id};type=objectsDebug;path=${path}`,
    )

    const dialog = page.getByTestId('nested-object-dialog')
    await expect(dialog).toBeVisible({timeout: 40_000})

    const nestedInput = dialog
      .getByTestId('field-objectWithArray.animalss[_key=="k1"].name')
      .getByTestId('string-input')
    await expect(nestedInput).toBeVisible()
    await expect(nestedInput).toHaveValue('Cat')
  })
})
