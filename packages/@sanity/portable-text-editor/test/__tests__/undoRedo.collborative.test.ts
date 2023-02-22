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
})
