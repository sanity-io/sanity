import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TableBlockValidationStory} from './TableBlockValidationStory'

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _type: 'table',
      _key: 't0',
      headerRows: 0,
      rows: [
        {
          _type: 'row',
          _key: 'r0',
          cells: [
            {
              _type: 'cell',
              _key: 'c0',
              value: [
                {
                  _type: 'block',
                  _key: 'cb0',
                  children: [{_type: 'span', _key: 'cb0-s', text: 'cell text', marks: []}],
                  markDefs: [],
                  style: 'normal',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      _type: 'table',
      _key: 't1',
      caption: 'A caption',
      headerRows: 0,
      rows: [
        {
          _type: 'row',
          _key: 'r1',
          cells: [
            {
              _type: 'cell',
              _key: 'c1',
              value: [
                {
                  _type: 'block',
                  _key: 'cb1',
                  children: [{_type: 'span', _key: 'cb1-s', text: 'other cell text', marks: []}],
                  markDefs: [],
                  style: 'normal',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const {render} = await import('vitest-browser-react')

describe('Portable Text Input - validation on a table block itself', () => {
  it('renders a rule.custom error keyed to the table block on the table wrapper', async () => {
    const {getFocusedPortableTextEditor} = testHelpers()

    void render(<TableBlockValidationStory document={document} />)

    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveTextContent('cell text')

    const $table = page.getByTestId('pte-table-block').nth(0)
    const $captionedTable = page.getByTestId('pte-table-block').nth(1)
    await expect.poll(() => $table.element().hasAttribute('data-invalid')).toBe(true)

    await userEvent.hover($table)
    await expect.element(page.getByText('Table must have a caption')).toBeVisible()

    // Both tables validate in the same pass, so once the caption-less one
    // is marked, the captioned one has already been left unmarked.
    expect($captionedTable.element().hasAttribute('data-invalid')).toBe(false)
    expect($captionedTable.element().hasAttribute('data-warning')).toBe(false)
  })
})
