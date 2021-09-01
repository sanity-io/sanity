/**
 * @jest-environment ./test/setup/collaborative.jest.env.ts
 */

// eslint-disable-next-line import/no-unassigned-import
import '../setup/globals.jest'
import {PortableTextBlock} from '../../src'

const initialValue: PortableTextBlock[] | undefined = [
  {
    _key: 'randomKey0',
    _type: 'block',
    markDefs: [],
    style: 'normal',
    children: [{_key: 'randomKey1', _type: 'span', text: 'Hello', marks: []}],
  },
]

describe('selection adjustment', () => {
  beforeEach(async () => {
    await setDocumentValue(initialValue)
  })

  it('will keep A on same line if B insert above', async () => {
    const desiredSelection = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 2},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 2},
    }
    const [editorA, editorB] = await getEditors()
    await editorA.pressKey('ArrowRight', 2)
    let selectionA = await editorA.getSelection()
    expect(selectionA).toEqual(desiredSelection)
    await editorB.insertNewLine()
    selectionA = await editorA.getSelection()
    expect(selectionA).toEqual(desiredSelection)
  })
})
