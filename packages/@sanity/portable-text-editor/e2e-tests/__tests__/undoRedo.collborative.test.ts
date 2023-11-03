/** @jest-environment ./setup/collaborative.jest.env.ts */
import {toPlainText} from '@portabletext/toolkit'
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

function getInitialValue(text = 'Hello world'): PortableTextBlock[] {
  return [
    {
      _key: 'blockA',
      _type: 'block',
      markDefs: [],
      style: 'normal',
      children: [
        {
          _key: 'spanA',
          _type: 'span',
          text,
          marks: [],
        },
      ],
    },
  ]
}

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

  it('will let editor A undo their change after B did an unrelated change (multi-line block)', async () => {
    const initialText = 'First paragraph\n\nSecond paragraph!'
    await setDocumentValue(getInitialValue(initialText))
    const [editorA, editorB] = await getEditors()

    // Sanity-test for initial value
    expect(toPlainText((await editorA.getValue()) || [])).toBe(initialText)

    // Editor A sets selection at end of the second paragraph (after "!"), and adds a question mark
    const charOffset = initialText.indexOf('!') + 1
    const desiredSelectionA = {
      anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: charOffset},
      focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: charOffset},
    }
    await editorA.setSelection(desiredSelectionA)
    await editorA.insertText('?')

    // Sanity-test for edit
    const expectedEditedText = initialText.replace(/!/g, '!?')
    expect(toPlainText((await editorA.getValue()) || [])).toBe(expectedEditedText)

    // Editor B adds a new paragraph (_within same block_) to the start of the editor
    const newPrefix = 'Welcome.\n\n'
    await editorB.setSelection({
      anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
      focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
    })
    await editorB.insertText(newPrefix)

    // Editors should be in sync
    let valA = await editorA.getValue()
    let valB = await editorB.getValue()
    expect(valA).toEqual(valB)

    // Should have the edit from editor A, and the new paragraph from editor B
    expect(toPlainText(valA || [])).toBe(newPrefix + expectedEditedText)

    // Editor A undos their edit (`!?` => `!`)
    await editorA.undo()

    // Editors should still be in sync
    valA = await editorA.getValue()
    valB = await editorB.getValue()
    expect(valA).toEqual(valB)

    // Sanity-check that the value is still only a single block, not multiple
    expect(valA || []).toHaveLength(1)

    // Shape of editor should be the expected prefix + initial value
    expect(toPlainText(valA || [])).toBe(newPrefix + initialText)
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
          "_key": "A-6",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "A-5",
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
              "text": "Hello world",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "A-6",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "A-5",
              "_type": "span",
              "marks": Array [],
              "text": "",
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

  it("will undo correctly for editorB when editor A writes something before editor B's edits", async () => {
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
      anchor: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
      focus: {path: [{_key: 'randomKey0'}, 'children', {_key: 'randomKey1'}], offset: 18},
    }
    await editorB.setSelection(startSelectionB)
    await editorB.pressKey('Backspace')
    await editorA.insertText('123')
    let valA = await editorA.getValue()
    let valB = await editorB.getValue()
    expect(valA).toEqual(valB)
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
              "text": "Hello123 world there",
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
              "text": "Hello123 world there!",
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
              "text": "Hello world there!",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })

  it("will let editor A undo all changes after B pressed Enter and wrote something in between A's changes", async () => {
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
          "_key": "A-6",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "A-5",
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
          "_key": "A-6",
          "_type": "block",
          "children": Array [
            Object {
              "_key": "A-5",
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
    expect(selectionB).toMatchInlineSnapshot(`
      Object {
        "anchor": Object {
          "offset": 14,
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
          "offset": 14,
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

  describe('unicode-rich text', () => {
    it('undoing in reverse order as applied', async () => {
      const initialKanji = `速ヒマヤレ誌相ルなあね日諸せ変評ホ真攻同潔ク作先た員勝どそ際接レゅ自17浅ッ実情スヤ籍認ス重力務鳥の。8平はートご多乗12青國暮整ル通国うれけこ能新ロコラハ元横ミ休探ミソ梓批ざょにね薬展むい本隣ば禁抗ワアミ部真えくト提知週むすほ。査ル人形ルおじつ政謙減セヲモ読見れレぞえ録精てざ定第ぐゆとス務接産ヤ写馬エモス聞氏サヘマ有午ごね客岡ヘロ修彩枝雨父のけリド。\n\n住ゅなぜ日16語約セヤチ任政崎ソオユ枠体ぞン古91一専泉給12関モリレネ解透ぴゃラぼ転地す球北ドざう記番重投ぼづ。期ゃ更緒リだすし夫内オ代他られくド潤刊本クヘフ伊一ウムニヘ感週け出入ば勇起ょ関図ぜ覧説めわぶ室訪おがト強車傾町コ本喰杜椿榎ほれた。暮る生的更芸窓どさはむ近問ラ入必ラニス療心コウ怒応りめけひ載総ア北吾ヌイヘ主最ニ余記エツヤ州5念稼め化浮ヌリ済毎養ぜぼ。`
      await setDocumentValue(getInitialValue(initialKanji))
      const [editorA, editorB] = await getEditors()

      // Sanity-test for initial value
      expect(toPlainText((await editorA.getValue()) || [])).toBe(initialKanji)

      // Editor A sets selection at start of span, and prepends "Paragraph 1: "
      const desiredSelectionA = {
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
      }
      const p1Prefix = 'Paragraph 1: '
      await editorA.setSelection(desiredSelectionA)
      await editorA.insertText(p1Prefix)

      // Sanity-test for edit
      const prefixedValue = `${p1Prefix}${initialKanji}`
      expect(toPlainText((await editorA.getValue()) || [])).toBe(prefixedValue)

      // Editor B moves to the end of the first paragraph, and adds ` (end of paragraph 1)`
      const p1Suffix = ' (end of paragraph 1)'
      const p1SuffixOffset = prefixedValue.indexOf('\n\n')
      await editorB.setSelection({
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: p1SuffixOffset},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: p1SuffixOffset},
      })
      await editorB.insertText(p1Suffix)

      // Editors should be in sync
      let [valA, valB] = await Promise.all([editorA.getValue(), editorB.getValue()])
      expect(valA).toEqual(valB)

      // Should have the prefix from editor A, and the new suffix from editor B
      const expectedPreAndPostfixedValue = prefixedValue.replace(/\n\n/, `${p1Suffix}\n\n`)
      expect(toPlainText(valA || [])).toBe(expectedPreAndPostfixedValue)

      // Editor A moves to the end of the editor and adds a final `. EOL.` - eg "end of line"
      const p2EOL = `. EOL.`
      await editorA.setSelection({
        anchor: {
          path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}],
          offset: expectedPreAndPostfixedValue.length,
        },
        focus: {
          path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}],
          offset: expectedPreAndPostfixedValue.length,
        },
      })
      await editorA.insertText(p2EOL)

      // Editors should still be in sync
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)

      // And they should have the full, expected value
      expect(toPlainText(valB || [])).toBe(`${expectedPreAndPostfixedValue}${p2EOL}`)

      // Editor A undos their last edit (removes `. EOL.` suffix)
      await editorA.undo()

      // Ensure both editors have the same, reverted value
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)
      expect(toPlainText(valB || [])).toBe(expectedPreAndPostfixedValue)

      // Editor B reverts their suffix
      await editorB.undo()

      // Ensure we have reverted back to only the first paragraph prefix
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)
      expect(toPlainText(valA || [])).toBe(prefixedValue)

      // Editor A undos their first prefix (we should be back to the initial value)
      await editorA.undo()
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)
      expect(toPlainText(valA || [])).toBe(initialKanji)
    })

    it('undoing out-of-order', async () => {
      const initialKanji = `速ヒマヤレ誌相ルなあね日諸せ変評ホ真攻同潔ク作先た員勝どそ際接レゅ自17浅ッ実情スヤ籍認ス重力務鳥の。8平はートご多乗12青國暮整ル通国うれけこ能新ロコラハ元横ミ休探ミソ梓批ざょにね薬展むい本隣ば禁抗ワアミ部真えくト提知週むすほ。査ル人形ルおじつ政謙減セヲモ読見れレぞえ録精てざ定第ぐゆとス務接産ヤ写馬エモス聞氏サヘマ有午ごね客岡ヘロ修彩枝雨父のけリド。\n\n住ゅなぜ日16語約セヤチ任政崎ソオユ枠体ぞン古91一専泉給12関モリレネ解透ぴゃラぼ転地す球北ドざう記番重投ぼづ。期ゃ更緒リだすし夫内オ代他られくド潤刊本クヘフ伊一ウムニヘ感週け出入ば勇起ょ関図ぜ覧説めわぶ室訪おがト強車傾町コ本喰杜椿榎ほれた。暮る生的更芸窓どさはむ近問ラ入必ラニス療心コウ怒応りめけひ載総ア北吾ヌイヘ主最ニ余記エツヤ州5念稼め化浮ヌリ済毎養ぜぼ。`
      await setDocumentValue(getInitialValue(initialKanji))
      const [editorA, editorB] = await getEditors()

      // Sanity-test for initial value
      expect(toPlainText((await editorA.getValue()) || [])).toBe(initialKanji)

      // Editor A sets selection at start of span, and prepends "Paragraph 1: "
      const desiredSelectionA = {
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
      }
      const p1Prefix = 'Paragraph 1: '
      await editorA.setSelection(desiredSelectionA)
      await editorA.insertText(p1Prefix)

      // Sanity-test for edit
      const prefixedValue = `${p1Prefix}${initialKanji}`
      expect(toPlainText((await editorA.getValue()) || [])).toBe(prefixedValue)

      // Editor B moves to the end of the first paragraph, and adds ` (end of paragraph 1)`
      const p1Suffix = ' (end of paragraph 1)'
      const p1SuffixOffset = prefixedValue.indexOf('\n\n')
      await editorB.setSelection({
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: p1SuffixOffset},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: p1SuffixOffset},
      })
      await editorB.insertText(p1Suffix)

      // Editors should be in sync
      let [valA, valB] = await Promise.all([editorA.getValue(), editorB.getValue()])
      expect(valA).toEqual(valB)

      // Should have the prefix from editor A, and the new suffix from editor B
      const expectedPreAndPostfixedValue = prefixedValue.replace(/\n\n/, `${p1Suffix}\n\n`)
      expect(toPlainText(valA || [])).toBe(expectedPreAndPostfixedValue)

      // Editor A moves to the end of the editor and adds a final `. EOL.` - eg "end of line"
      const p2EOL = `. EOL.`
      await editorA.setSelection({
        anchor: {
          path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}],
          offset: expectedPreAndPostfixedValue.length,
        },
        focus: {
          path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}],
          offset: expectedPreAndPostfixedValue.length,
        },
      })
      await editorA.insertText(p2EOL)

      // Editors should still be in sync
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)

      // And they should have the full, expected value
      expect(toPlainText(valB || [])).toBe(`${expectedPreAndPostfixedValue}${p2EOL}`)

      // Editor A undos their last edit (removes `. EOL.` suffix)
      await editorA.undo()

      // Ensure both editors have the same, reverted value
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)
      expect(toPlainText(valB || [])).toBe(expectedPreAndPostfixedValue)

      // Note how Editor B does _not_ revert their suffix here, but with two editor A undos,
      // the editor prefix (`Paragraph 1: `) and suffix (`. EOL.`) should both be gone, and
      // Editor B's edit (the ` (end of paragraph 1)`) suffix should be left in place.
      // The opposite case is handled in test above ("reverse order")
      await editorA.undo()

      const expectedEditorARollback = initialKanji.replace(/\n\n/, `${p1Suffix}\n\n`)
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)
      expect(toPlainText(valA || [])).toBe(expectedEditorARollback)

      // Editor B undos _their_ edit (removes ` (end of paragraph 1)` suffix),
      // meaning we should be back to the original value
      await editorB.undo()
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)
      expect(toPlainText(valA || [])).toBe(initialKanji)
    })

    it('editor A undo their change after B did an unrelated change (single-line, emoji)', async () => {
      const [beginning, middle, end] = [
        'A curious 🦊 named Felix lived in the 🪄🌲 of Willowwood. One day, he discovered a mysterious 🕳️, which lead to a magical 🌌. ',
        'In the 🪐 of Celestia, 🦊 met a friendly 🌈🦄 named Sparkle. ',
        'They had extraordinary adventures together, befriending a 🧚, who gave them so many 📚 that they never lacked for reading material!',
      ]
      const initialText = `${beginning}${end}`
      await setDocumentValue(getInitialValue(initialText))
      const [editorA, editorB] = await getEditors()

      // Sanity-test for initial value
      expect(toPlainText((await editorA.getValue()) || [])).toBe(initialText)

      // Editor A sets selection at end of the text (after the character `!`), and removes it
      const charOffset = initialText.indexOf('!') + 1
      const desiredSelectionA = {
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: charOffset},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: charOffset},
      }
      await editorA.setSelection(desiredSelectionA)
      await editorA.pressKey('Backspace')

      // Sanity-test for edit
      const expectedEditedText = initialText.slice(0, -1)
      expect(toPlainText((await editorA.getValue()) || [])).toBe(expectedEditedText)
      expect(await editorB.getValue()).toEqual(await editorA.getValue())

      // Editor B adds some new text in the middle of the span (after `🌌. `)
      await editorB.setSelection({
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 127},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 127},
      })

      await editorB.insertText(middle)

      // Editors should be in sync
      let valA = await editorA.getValue()
      let valB = await editorB.getValue()
      expect(valA).toEqual(valB)

      // Should have the untouched start of the story, the newly inserted middle, and the edit removing the trailing `!`
      const expectedEditedEnd = end.slice(0, -1)
      expect(toPlainText(valA || [])).toBe(`${beginning}${middle}${expectedEditedEnd}`)

      // Editor A undos their edit (`reading material` => `reading material!`)
      await editorA.undo()

      // Editors should still be in sync
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)

      // Shape of editor should be the expected full story
      expect(toPlainText(valA || [])).toBe(`${beginning}${middle}${end}`)

      // Sanity-check that the value is still only a single block, not multiple
      expect(valA || []).toHaveLength(1)
    })

    it('editor A undo their change after B did an unrelated change (multi-line block, emoji)', async () => {
      const initialText = `In the 🪐 of Celestia, 🦊 met a friendly 🌈🦄 named Sparkle.\n\nThey had extraordinary adventures together, befriending a 🧚, who gave them so many 📚 that they never lacked for reading material!`
      await setDocumentValue(getInitialValue(initialText))
      const [editorA, editorB] = await getEditors()

      // Sanity-test for initial value
      expect(toPlainText((await editorA.getValue()) || [])).toBe(initialText)

      // Editor A sets selection at end of the second paragraph (after the character `!`), and removes it
      const charOffset = initialText.indexOf('!') + 1
      const desiredSelectionA = {
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: charOffset},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: charOffset},
      }
      await editorA.setSelection(desiredSelectionA)
      await editorA.pressKey('Backspace')

      // Sanity-test for edit
      const expectedEditedText = initialText.replace(/!/g, '')
      expect(toPlainText((await editorA.getValue()) || [])).toBe(expectedEditedText)
      expect(await editorB.getValue()).toEqual(await editorA.getValue())

      // Editor B adds a new paragraph (_within same block_) to the start of the editor
      const newPrefix =
        'A curious 🦊 named Felix lived in the 🪄🌲 of Willowwood. One day, he discovered a mysterious 🕳️, which lead to a magical 🌌.\n\n'
      await editorB.setSelection({
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
      })
      await editorB.insertText(newPrefix)

      // Editors should be in sync
      let valA = await editorA.getValue()
      let valB = await editorB.getValue()
      expect(valA).toEqual(valB)

      // Should have the edit from editor A, and the new paragraph from editor B
      expect(toPlainText(valA || [])).toBe(newPrefix + expectedEditedText)

      // Editor A undos their edit (`reading material` => `reading material!`)
      await editorA.undo()

      // Editors should still be in sync
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)

      // Sanity-check that the value is still only a single block, not multiple
      expect(valA || []).toHaveLength(1)

      // Shape of editor should be the expected prefix + initial value
      expect(toPlainText(valA || [])).toBe(newPrefix + initialText)
    })

    it('editor A undo their change after B did an unrelated change (multi-line block, kanji)', async () => {
      const initialText = `彼は、偉大な番兵がまさに尾根の頂上にいて、裸足では地面から最も低い枝にあることを知っていた。 彼は腹ばいになって雪と泥の中に滑り込み、下の何もない空き地を見下ろした。\n\n彼の心臓は胸の中で止まった。 しばらくの間、彼は息をすることさえできなかった。 月明かりは空き地、キャンプファイヤーの灰、雪に覆われた斜面、大きな岩、半分凍った小さな小川を照らしていました。すべては数1時間前とまったく同じでした。`
      await setDocumentValue(getInitialValue(initialText))
      const [editorA, editorB] = await getEditors()

      // Sanity-test for initial value
      expect(toPlainText((await editorA.getValue()) || [])).toBe(initialText)

      // Editor A sets selection at end of the second paragraph (after the number `1`), and removes it
      const charOffset = initialText.indexOf('1') + 1
      const desiredSelectionA = {
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: charOffset},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: charOffset},
      }
      await editorA.setSelection(desiredSelectionA)
      await editorA.pressKey('Backspace')

      // Sanity-test for edit
      const expectedEditedText = initialText.replace(/数1/g, '数')
      expect(toPlainText((await editorA.getValue()) || [])).toBe(expectedEditedText)
      expect(await editorB.getValue()).toEqual(await editorA.getValue())

      // Editor B adds a new paragraph (_within same block_) to the start of the editor
      const newPrefix =
        '彼の背後で、領主のリングメイルの柔らかい金属の滑り音、葉のカサカサ音、そして伸びた枝が彼の長剣を掴み、華麗なクロテンのマントを引っ張りながら呪いの言葉をつぶやくのが聞こえた。\n\n'
      await editorB.setSelection({
        anchor: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
        focus: {path: [{_key: 'blockA'}, 'children', {_key: 'spanA'}], offset: 0},
      })
      await editorB.insertText(newPrefix)

      // Editors should be in sync
      let valA = await editorA.getValue()
      let valB = await editorB.getValue()
      expect(valA).toEqual(valB)

      // Should have the edit from editor A, and the new paragraph from editor B
      expect(toPlainText(valA || [])).toBe(newPrefix + expectedEditedText)

      // Editor A undos their edit (`数` => `数1`)
      await editorA.undo()

      // Editors should still be in sync
      valA = await editorA.getValue()
      valB = await editorB.getValue()
      expect(valA).toEqual(valB)

      // Shape of editor should be the expected prefix + initial value
      expect(toPlainText(valA || [])).toBe(newPrefix + initialText)

      // Sanity-check that the value is still only a single block, not multiple
      expect(valA || []).toHaveLength(1)
    })
  })
})
