/** @jest-environment ./test/setup/collaborative.jest.env.ts */

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
      const expectedSelectionA = {
        anchor: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey'}], offset: 2},
        focus: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey'}], offset: 2},
      }
      const [editorA, editorB] = await getEditors()
      await editorA.pressKey('ArrowRight', 2)
      let selectionA = await editorA.getSelection()
      expect(selectionA).toEqual(expectedSelectionA)
      await editorB.pressKey('Enter')
      expect(await editorA.getValue()).toMatchInlineSnapshot(`
        Array [
          Object {
            "_key": "someKey",
            "_type": "block",
            "children": Array [
              Object {
                "_key": "anotherKey",
                "_type": "span",
                "marks": Array [],
                "text": "",
              },
            ],
            "markDefs": Array [],
            "style": "normal",
          },
          Object {
            "_key": "B-6",
            "_type": "block",
            "children": Array [
              Object {
                "_key": "B-5",
                "_type": "span",
                "marks": Array [],
                "text": "Hello",
              },
            ],
            "markDefs": Array [],
            "style": "normal",
          },
        ]
      `)
      selectionA = await editorA.getSelection()
      expect(selectionA).toMatchInlineSnapshot(`
        Object {
          "anchor": Object {
            "offset": 0,
            "path": Array [
              Object {
                "_key": "someKey",
              },
              "children",
              Object {
                "_key": "anotherKey",
              },
            ],
          },
          "focus": Object {
            "offset": 0,
            "path": Array [
              Object {
                "_key": "someKey",
              },
              "children",
              Object {
                "_key": "anotherKey",
              },
            ],
          },
        }
      `)
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
    it('will keep A on same line if B backspace-deletes an empty line above', async () => {
      await setDocumentValue([
        {
          _key: 'someKey1',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey1', _type: 'span', text: '', marks: []}],
        },
        {
          _key: 'someKey2',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey2', _type: 'span', text: '', marks: []}],
        },
        {
          _key: 'someKey3',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey3', _type: 'span', text: '', marks: []}],
        },
        {
          _key: 'someKey4',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey4', _type: 'span', text: '', marks: []}],
        },
        {
          _key: 'someKey5',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey5', _type: 'span', text: 'Three', marks: []}],
        },
      ])
      const expectedSelection = {
        anchor: {path: [{_key: 'someKey5'}, 'children', {_key: 'anotherKey5'}], offset: 5},
        focus: {path: [{_key: 'someKey5'}, 'children', {_key: 'anotherKey5'}], offset: 5},
      }
      const [editorA, editorB] = await getEditors()
      await editorA.setSelection(expectedSelection)
      expect(await editorA.getSelection()).toEqual(expectedSelection)
      await editorB.setSelection({
        anchor: {path: [{_key: 'someKey4'}, 'children', {_key: 'anotherKey4'}], offset: 0},
        focus: {path: [{_key: 'someKey4'}, 'children', {_key: 'anotherKey4'}], offset: 0},
      })
      await editorB.pressKey('Backspace')
      await editorB.pressKey('Backspace')
      await editorB.pressKey('Backspace')
      const valueA = await editorA.getValue()
      const valueB = await editorB.getValue()
      expect(valueB).toMatchInlineSnapshot(`
        Array [
          Object {
            "_key": "someKey4",
            "_type": "block",
            "children": Array [
              Object {
                "_key": "anotherKey4",
                "_type": "span",
                "marks": Array [],
                "text": "",
              },
            ],
            "markDefs": Array [],
            "style": "normal",
          },
          Object {
            "_key": "someKey5",
            "_type": "block",
            "children": Array [
              Object {
                "_key": "anotherKey5",
                "_type": "span",
                "marks": Array [],
                "text": "Three",
              },
            ],
            "markDefs": Array [],
            "style": "normal",
          },
        ]
      `)
      expect(valueA).toEqual(valueB)
      expect(await editorA.getSelection()).toEqual(expectedSelection)
    })
    it('will keep A on same line if B inserts a line above', async () => {
      await setDocumentValue([
        {
          _key: 'someKey2',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey2', _type: 'span', text: '', marks: []}],
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
        anchor: {path: [{_key: 'someKey3'}, 'children', {_key: 'anotherKey3'}], offset: 0},
        focus: {path: [{_key: 'someKey3'}, 'children', {_key: 'anotherKey3'}], offset: 0},
      }
      const [editorA, editorB] = await getEditors()
      await editorA.setSelection(expectedSelection)
      expect(await editorA.getSelection()).toEqual(expectedSelection)
      await editorB.setSelection({
        anchor: {path: [{_key: 'someKey2'}, 'children', {_key: 'anotherKey2'}], offset: 0},
        focus: {path: [{_key: 'someKey2'}, 'children', {_key: 'anotherKey2'}], offset: 0},
      })
      await editorB.pressKey('Enter')
      const valueA = await editorA.getValue()
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
              text: '',
              marks: [],
            },
          ],
        },
        {
          _key: 'B-6',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [
            {
              _key: 'B-5',
              _type: 'span',
              text: '',
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
      expect(valueA).toEqual(valueB)
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
          children: [{_key: 'anotherKey5', _type: 'span', text: '1', marks: []}],
        },
        {
          _key: 'someKey6',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey6', _type: 'span', text: '22', marks: []}],
        },
        {
          _key: 'someKey7',
          _type: 'block',
          markDefs: [],
          style: 'normal',
          children: [{_key: 'anotherKey7', _type: 'span', text: '333', marks: []}],
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
              text: '122',
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
              text: '333',
              marks: [],
            },
          ],
        },
      ])
      const valueA = await editorA.getValue()
      expect(valueA).toEqual(valueB)
      expect(await editorA.getSelection()).toMatchInlineSnapshot(`
        Object {
          "anchor": Object {
            "offset": 0,
            "path": Array [
              Object {
                "_key": "someKey7",
              },
              "children",
              Object {
                "_key": "anotherKey7",
              },
            ],
          },
          "focus": Object {
            "offset": 0,
            "path": Array [
              Object {
                "_key": "someKey7",
              },
              "children",
              Object {
                "_key": "anotherKey7",
              },
            ],
          },
        }
      `)
    })
  })

  it('will keep A on same word if B merges marks within that line', async () => {
    await setDocumentValue([
      {
        _key: 'someKey',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {_key: 'anotherKey1', _type: 'span', text: '1 ', marks: []},
          {_key: 'anotherKey2', _type: 'span', text: '22', marks: ['strong']},
          {_key: 'anotherKey3', _type: 'span', text: ' 333', marks: []},
        ],
      },
    ])
    const expectedSelectionA = {
      anchor: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey3'}], offset: 1},
      focus: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey3'}], offset: 1},
    }
    const [editorA, editorB] = await getEditors()
    await editorA.setSelection(expectedSelectionA)
    expect(await editorA.getSelection()).toEqual(expectedSelectionA)
    const expectedSelectionB = {
      anchor: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey2'}], offset: 0},
      focus: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey2'}], offset: 2},
    }
    await editorB.setSelection(expectedSelectionB)
    expect(await editorB.getSelection()).toEqual(expectedSelectionB)
    await editorB.toggleMark()
    const valueB = await editorB.getValue()
    expect(valueB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "someKey",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "anotherKey1",
              "_type": "span",
              "marks": Array [],
              "text": "1 22 333",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    const valueA = await editorA.getValue()
    expect(valueA).toEqual(valueB)
    expect(await editorA.getSelection()).toEqual({
      anchor: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey1'}], offset: 8},
      focus: {path: [{_key: 'someKey'}, 'children', {_key: 'anotherKey1'}], offset: 8},
    })
  })

  it('will keep A on same selection if B toggles marks on another block', async () => {
    await setDocumentValue([
      {
        _key: 'someKey1',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [{_key: 'anotherKey1', _type: 'span', text: '1', marks: ['strong']}],
      },
      {
        _key: 'someKey2',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [{_key: 'anotherKey2', _type: 'span', text: '2', marks: []}],
      },
    ])
    const expectedSelectionA = {
      anchor: {path: [{_key: 'someKey1'}, 'children', {_key: 'anotherKey1'}], offset: 0},
      focus: {path: [{_key: 'someKey1'}, 'children', {_key: 'anotherKey1'}], offset: 1},
    }
    const expectedSelectionB = {
      anchor: {path: [{_key: 'someKey2'}, 'children', {_key: 'anotherKey2'}], offset: 0},
      focus: {path: [{_key: 'someKey2'}, 'children', {_key: 'anotherKey2'}], offset: 1},
    }
    const [editorA, editorB] = await getEditors()
    await editorA.setSelection(expectedSelectionA)
    await editorB.setSelection(expectedSelectionB)
    expect(await editorA.getSelection()).toEqual(expectedSelectionA)
    expect(await editorB.getSelection()).toEqual(expectedSelectionB)
    await editorA.toggleMark()
    const valueB = await editorB.getValue()
    expect(valueB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "someKey1",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "anotherKey1",
              "_type": "span",
              "marks": Array [],
              "text": "1",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "someKey2",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "anotherKey2",
              "_type": "span",
              "marks": Array [],
              "text": "2",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    const valueA = await editorA.getValue()
    expect(valueA).toEqual(valueB)
    expect(await editorA.getSelection()).toEqual({
      anchor: {path: [{_key: 'someKey1'}, 'children', {_key: 'anotherKey1'}], offset: 0},
      focus: {path: [{_key: 'someKey1'}, 'children', {_key: 'anotherKey1'}], offset: 1},
    })
    expect(await editorB.getSelection()).toEqual({
      anchor: {path: [{_key: 'someKey2'}, 'children', {_key: 'anotherKey2'}], offset: 0},
      focus: {path: [{_key: 'someKey2'}, 'children', {_key: 'anotherKey2'}], offset: 1},
    })
  })
})
