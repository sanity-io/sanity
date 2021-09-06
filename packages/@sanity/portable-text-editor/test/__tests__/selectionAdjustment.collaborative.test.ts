/**
 * @jest-environment ./test/setup/collaborative.jest.env.ts
 */

// eslint-disable-next-line import/no-unassigned-import
import '../setup/globals.jest'

describe('selection adjustment', () => {
  describe('insert and unset blocks', () => {
    it('will keep A on same line if B insert above', async () => {
      await setDocumentValue([
        {
          _key: 'someKey',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey', _type: 'span', text: 'Hello', marks: []}],
        },
      ])
      const expectedSelection = {
        anchor: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey'}], offset: 2},
        focus: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey'}], offset: 2},
      }
      const [editorA, editorB] = await getEditors()
      await editorA.pressKey('ArrowRight', 2)
      let selectionA = await editorA.getSelection()
      expect(selectionA).toEqual(expectedSelection)
      await editorB.insertNewLine()
      selectionA = await editorA.getSelection()
      expect(selectionA).toEqual(expectedSelection)
    })

    it('will keep A on same line if B delete a line above', async () => {
      await setDocumentValue([
        {
          _key: 'someKey1',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey1', _type: 'span', text: 'One', marks: []}],
        },
        {
          _key: 'someKey2',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey2', _type: 'span', text: 'Two', marks: []}],
        },
        {
          _key: 'someKey3',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey3', _type: 'span', text: 'Three', marks: []}],
        },
      ])
      const expectedSelection = {
        anchor: {path: [{_key: 'someKey2'}, 'children', {_key: 'anotherKey2'}], offset: 2},
        focus: {path: [{_key: 'someKey2'}, 'children', {_key: 'anotherKey2'}], offset: 2},
      }
      const [editorA, editorB] = await getEditors()
      await editorA.setSelection(expectedSelection)
      expect(await editorA.getSelection()).toEqual(expectedSelection)
      await editorB.setSelection({
        anchor: {path: [{_key: 'someKey1'}, 'children', {_key: 'anotherKey1'}], offset: 3},
        focus: {path: [{_key: 'someKey1'}, 'children', {_key: 'anotherKey1'}], offset: 3},
      })
      await editorB.pressKey('Backspace', 3)
      await editorB.pressKey('Delete')
      const valueB = await editorB.getValue()
      expect(valueB).toEqual([
        {
          _key: 'someKey2',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [
            {
              _key: 'anotherKey2',
              _type: 'span',
              text: 'Two',
              marks: [],
            },
          ],
        },
        {
          _key: 'someKey3',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [
            {
              _key: 'anotherKey3',
              _type: 'span',
              text: 'Three',
              marks: [],
            },
          ],
        },
      ])
      expect(await editorA.getSelection()).toEqual(expectedSelection)
    })
  })

  describe('when merging text', () => {
    it("will keep A on same word if B merges A's line into the above line", async () => {
      await setDocumentValue([
        {
          _key: 'someKey5',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey5', _type: 'span', text: 'One', marks: []}],
        },
        {
          _key: 'someKey6',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey6', _type: 'span', text: 'Two', marks: []}],
        },
        {
          _key: 'someKey7',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey7', _type: 'span', text: 'Three', marks: []}],
        },
      ])
      const expectedSelection = {
        anchor: {path: [{_key: 'someKey6'}, 'children', {_key: 'anotherKey6'}], offset: 2},
        focus: {path: [{_key: 'someKey6'}, 'children', {_key: 'anotherKey6'}], offset: 2},
      }
      const [editorA, editorB] = await getEditors()
      await editorA.setSelection(expectedSelection)
      expect(await editorA.getSelection()).toEqual(expectedSelection)
      await editorB.setSelection({
        anchor: {path: [{_key: 'someKey6'}, 'children', {_key: 'anotherKey6'}], offset: 0},
        focus: {path: [{_key: 'someKey6'}, 'children', {_key: 'anotherKey6'}], offset: 0},
      })
      await editorB.pressKey('Backspace')
      const valueB = await editorB.getValue()
      expect(valueB).toEqual([
        {
          _key: 'someKey5',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [
            {
              _key: 'anotherKey5',
              _type: 'span',
              text: 'OneTwo',
              marks: [],
            },
          ],
        },
        {
          _key: 'someKey7',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [
            {
              _key: 'anotherKey7',
              _type: 'span',
              text: 'Three',
              marks: [],
            },
          ],
        },
      ])
      expect(await editorA.getSelection()).toEqual({
        anchor: {path: [{_key: 'someKey5'}, 'children', {_key: 'anotherKey5'}], offset: 6},
        focus: {path: [{_key: 'someKey5'}, 'children', {_key: 'anotherKey5'}], offset: 6},
      })
    })
  })
})
