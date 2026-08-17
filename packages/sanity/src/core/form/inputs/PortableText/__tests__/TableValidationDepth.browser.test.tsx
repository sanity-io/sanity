import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TableValidationDepthStory} from './TableValidationDepthStory'

const {render} = await import('vitest-browser-react')

const block = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  children: [{_type: 'span', _key: `${key}-s`, text, marks: []}],
  markDefs: [],
  style: 'normal',
})

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    block('b0', 'bad root text'),
    block('b1', 'clean root text'),
    {
      _type: 'table',
      _key: 't0',
      headerRows: 0,
      rows: [
        {
          _type: 'row',
          _key: 'r0',
          cells: [
            {_type: 'cell', _key: 'c0', value: [block('cb0', 'bad cell text')]},
            {_type: 'cell', _key: 'c1', value: [block('cb1', 'clean cell text')]},
          ],
        },
      ],
    },
  ],
}

describe('Portable Text Input - validation markers at depth', () => {
  it('renders the error marker on failing blocks at root and inside table cells alike', async () => {
    const {getFocusedPortableTextEditor} = testHelpers()

    void render(<TableValidationDepthStory document={document} />)

    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveTextContent('bad cell text')

    // Validation runs async in the harness; poll until the root control
    // shows its marker, then compare all four blocks in one snapshot.
    await expect.poll(() => errorStateByText()['bad root text']).toBe(true)
    expect(errorStateByText()).toEqual({
      'bad root text': true,
      'clean root text': false,
      'bad cell text': true,
      'clean cell text': false,
    })
  })
})

function errorStateByText() {
  const entries: Record<string, boolean> = {}
  for (const node of window.document.querySelectorAll('[data-testid="text-block__text"]')) {
    const text = node.textContent ?? ''
    entries[text.trim()] = node.hasAttribute('data-error')
  }
  return entries
}
