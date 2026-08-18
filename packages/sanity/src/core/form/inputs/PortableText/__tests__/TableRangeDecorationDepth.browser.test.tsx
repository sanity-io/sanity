import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TableRangeDecorationDepthStory} from './TableRangeDecorationDepthStory'

const {render} = await import('vitest-browser-react')

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _type: 'block',
      _key: 'b0',
      children: [{_type: 'span', _key: 'b0-s', text: 'root decorated here', marks: []}],
      markDefs: [],
      style: 'normal',
    },
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
                  children: [
                    {_type: 'span', _key: 'cb0-s', text: 'cell decorated here', marks: []},
                  ],
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

describe('Portable Text Input - range decorations at depth', () => {
  it('decorates ranges at the root and inside table cells alike', async () => {
    const {getFocusedPortableTextEditor} = testHelpers()

    void render(<TableRangeDecorationDepthStory document={document} />)

    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveTextContent('cell decorated here')

    await expect.poll(() => decorations().length).toBe(2)
    expect(decorations()).toEqual([
      {text: 'decorated', insideTable: false},
      {text: 'decorated', insideTable: true},
    ])
  })
})

function decorations() {
  return [...window.document.querySelectorAll('[data-testid="probe-decoration"]')].map((node) => ({
    text: node.textContent,
    insideTable: node.closest('table') !== null,
  }))
}
