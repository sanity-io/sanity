import {type Path, type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {FocusPathDepthStory} from './FocusPathDepthStory'

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
      children: [{_type: 'span', _key: 's0', text: 'root span', marks: []}],
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
                    {_type: 'span', _key: 'cs0', text: 'cell span', marks: []},
                    {_type: 'inlineNote', _key: 'cn0', note: 'deep note'},
                    {_type: 'span', _key: 'cs1', text: '', marks: []},
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

describe('Portable Text Input - focus path span suffix at depth', () => {
  it('reports spans with `.text` and inline objects without, at root and inside table cells', async () => {
    const paths: Path[] = []
    const pushPath = (path: Path) => paths.push(path)
    const {getFocusedPortableTextEditor, waitForFocusedNodeText} = testHelpers()

    void render(<FocusPathDepthStory document={document} onPathFocus={pushPath} />)

    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveTextContent('cell span')
    const lastPath = () => paths.slice(-1)[0]

    const rootNode = [...$pte.element().querySelectorAll('*')].find(
      (node) => node.childElementCount === 0 && node.textContent === 'root span',
    )
    await userEvent.click(rootNode as HTMLElement)
    await waitForFocusedNodeText('root span')
    await expect.poll(lastPath).toEqual(['body', {_key: 'b0'}, 'children', {_key: 's0'}, 'text'])

    const cellNode = [...$pte.element().querySelectorAll('*')].find(
      (node) => node.childElementCount === 0 && node.textContent === 'cell span',
    )
    await userEvent.click(cellNode as HTMLElement)
    await waitForFocusedNodeText('cell span')
    await expect
      .poll(lastPath)
      .toEqual([
        'body',
        {_key: 't0'},
        'rows',
        {_key: 'r0'},
        'cells',
        {_key: 'c0'},
        'value',
        {_key: 'cb0'},
        'children',
        {_key: 'cs0'},
        'text',
      ])

    // An inline object is a child but not a span, so its reported path
    // stays suffix-free; a span check by path shape would get this wrong
    // at depth.
    const $inlineObject = page.getByTestId('inline-preview')
    await $inlineObject.click()
    await expect
      .poll(lastPath)
      .toEqual([
        'body',
        {_key: 't0'},
        'rows',
        {_key: 'r0'},
        'cells',
        {_key: 'c0'},
        'value',
        {_key: 'cb0'},
        'children',
        {_key: 'cn0'},
      ])
  })
})
