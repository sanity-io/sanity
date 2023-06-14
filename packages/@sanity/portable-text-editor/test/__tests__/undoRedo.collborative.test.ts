/** @jest-environment ./test/setup/collaborative.jest.env.ts */

import '../setup/globals.jest'
import type {PortableTextBlock} from '@sanity/types'

const initialValue: PortableTextBlock[] = [
  {
    _key: 'randomKey0',
    _type: 'block',
    markDefs: [],
    style: 'normal',
    children: [
      {
        _key: 'randomKey1',
        _type: 'span',
        text: 'Hello world',
        marks: [],
      },
    ],
  },
]

describe('undo/redo', () => {
  it("will let editor A undo all changes after B wrote something in between A's changes", async () => {
    await setDocumentValue(initialValue)
    const [editorA, editorB] = await getEditors()
    const desiredSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
    }
    await editorA.setSelection(desiredSelectionA)
    await editorA.pressKey('Backspace')
    await editorB.setSelection({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    })
    await editorB.insertText(' there!')
    let valA = await editorA.getValue()
    let valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello worl there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    await editorA.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })

  it("will let editor A undo all changes after B pressed Enter in between A's changes", async () => {
    await setDocumentValue(initialValue)
    const [editorA, editorB] = await getEditors()
    const desiredSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
    }
    await editorA.setSelection(desiredSelectionA)
    await editorA.pressKey('Enter')
    await editorA.insertText('Hey!')
    await editorB.setSelection({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    })
    await editorB.insertText(' there!')
    let valA = await editorA.getValue()
    let valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "A-3",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "A-2",
              "_type": "span",
              "marks": Array [],
              "text": "Hey!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    await editorA.undo()
    await editorA.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })

  it('will undo respective changes in same text node correctly', async () => {
    const val: PortableTextBlock[] = [
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world there!',
            marks: [],
          },
        ],
      },
    ]
    await setDocumentValue(val)
    const [editorA, editorB] = await getEditors()
    const startSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 5},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 5},
    }
    await editorA.setSelection(startSelectionA)
    const startSelectionB = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    }
    await editorB.setSelection(startSelectionB)
    await editorA.insertText('123')
    await editorB.insertText('ABC')
    let valA = await editorA.getValue()
    let valB = await editorB.getValue()
    expect(valA).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello123 worldABC there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    expect(valA).toEqual(valB)
    await editorA.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello worldABC there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    await editorB.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    const selectionA = await editorA.getSelection()
    expect(selectionA).toEqual(startSelectionA)
    const selectionB = await editorB.getSelection()
    expect(selectionB).toEqual(startSelectionB)
  })

  it("will let editor A undo all changes after B pressed Enter in between A's changes", async () => {
    await setDocumentValue(initialValue)
    const [editorA, editorB] = await getEditors()
    const desiredSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
    }
    await editorA.setSelection(desiredSelectionA)
    await editorA.pressKey('Enter')
    await editorA.insertText('Hey!')
    await editorB.setSelection({
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    })
    await editorB.insertText(' there!')
    let valA = await editorA.getValue()
    let valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "A-3",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "A-2",
              "_type": "span",
              "marks": Array [],
              "text": "Hey!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    await editorA.undo()
    await editorA.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })

  it('will undo respective changes in same text node correctly when splitting a block', async () => {
    const val: PortableTextBlock[] = [
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world there!',
            marks: [],
          },
        ],
      },
    ]
    await setDocumentValue(val)
    const [editorA, editorB] = await getEditors()
    const startSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 5},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 5},
    }
    await editorA.setSelection(startSelectionA)
    const startSelectionB = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    }
    await editorB.setSelection(startSelectionB)
    await editorA.insertText('123')
    await editorB.insertText('ABC')
    await editorA.pressKey('Enter')
    let valA = await editorA.getValue()
    let valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello123",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "A-3",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "A-2",
              "_type": "span",
              "marks": Array [],
              "text": " worldABC there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    await editorA.undo()
    await editorB.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello123 world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    const selectionA = await editorA.getSelection()
    expect(selectionA).toMatchInlineSnapshot(`
      Object {
        "anchor": Object {
          "offset": 8,
          "path": Array [
            Object {
              "_key": "randomKey0",
            },
            "children",
            Object {
              "_key": "randomKey1",
            },
          ],
        },
        "focus": Object {
          "offset": 8,
          "path": Array [
            Object {
              "_key": "randomKey0",
            },
            "children",
            Object {
              "_key": "randomKey1",
            },
          ],
        },
      }
    `)
    const selectionB = await editorB.getSelection()
    expect(selectionB).toBe(null)
  })

  it('will undo respective changes in same text node correctly', async () => {
    const val: PortableTextBlock[] = [
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: 'Hello world there!',
            marks: [],
          },
        ],
      },
    ]
    await setDocumentValue(val)
    const [editorA, editorB] = await getEditors()
    const startSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 5},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 5},
    }
    await editorA.setSelection(startSelectionA)
    const startSelectionB = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 11},
    }
    await editorB.setSelection(startSelectionB)
    await editorA.pressKey('1')
    await editorA.pressKey('2')
    await editorA.pressKey('3')
    await editorB.pressKey('A')
    await editorB.pressKey('B')
    await editorB.pressKey('C')
    let valA = await editorA.getValue()
    let valB = await editorB.getValue()
    expect(valA).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello123 worldABC there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    expect(valA).toEqual(valB)
    await editorA.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello worldABC there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    await editorB.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    const selectionA = await editorA.getSelection()
    expect(selectionA).toEqual(startSelectionA)
    const selectionB = await editorB.getSelection()
    expect(selectionB).toEqual(startSelectionB)
    await editorA.redo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello123 world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    await editorB.redo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "Hello123 worldABC there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })

  it('will undo respective changes in different blocks correctly', async () => {
    const val: PortableTextBlock[] = [
      {
        _key: 'randomKey0',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey1',
            _type: 'span',
            text: '1',
            marks: [],
          },
        ],
      },
      {
        _key: 'randomKey2',
        _type: 'block',
        markDefs: [],
        style: 'normal',
        children: [
          {
            _key: 'randomKey3',
            _type: 'span',
            text: '2',
            marks: [],
          },
        ],
      },
    ]
    await setDocumentValue(val)
    const [editorA, editorB] = await getEditors()
    const startSelectionA = {
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 1},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 1},
    }
    await editorA.setSelection(startSelectionA)
    const startSelectionB = {
      anchor: {path: [{_key: 'randomKey2'}, 'children', {_key: 'randomKey3'}], offset: 1},
      focus: {path: [{_key: 'randomKey2'}, 'children', {_key: 'randomKey3'}], offset: 1},
    }
    await editorB.setSelection(startSelectionB)
    await editorA.pressKey('a')
    await editorB.pressKey('b')
    let valA = await editorA.getValue()
    let valB = await editorB.getValue()
    expect(valA).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "1a",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "randomKey2",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey3",
              "_type": "span",
              "marks": Array [],
              "text": "2b",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    expect(valA).toEqual(valB)
    await editorA.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "1",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "randomKey2",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey3",
              "_type": "span",
              "marks": Array [],
              "text": "2b",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    await editorB.undo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "1",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "randomKey2",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey3",
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
    const selectionA = await editorA.getSelection()
    expect(selectionA).toEqual(startSelectionA)
    const selectionB = await editorB.getSelection()
    expect(selectionB).toEqual(startSelectionB)
    await editorA.redo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "1a",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "randomKey2",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey3",
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
    await editorB.redo()
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)
    expect(valB).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "randomKey0",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey1",
              "_type": "span",
              "marks": Array [],
              "text": "1a",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "randomKey2",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "randomKey3",
              "_type": "span",
              "marks": Array [],
              "text": "2b",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })
})
