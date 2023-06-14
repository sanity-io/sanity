import {createEditor, Descendant} from 'slate'
import {PortableTextTextBlock} from '@sanity/types'
import {getPortableTextMemberSchemaTypes} from '../getPortableTextMemberSchemaTypes'
import {schemaType} from '../../editor/__tests__/PortableTextEditorTester'
import {createOperationToPatches} from '../operationToPatches'
import {withPlugins} from '../../editor/plugins'
import {PortableTextEditor, PortableTextEditorProps} from '../..'
import {defaultKeyGenerator} from '../../editor/hooks/usePortableTextEditorKeyGenerator'

const portableTextFeatures = getPortableTextMemberSchemaTypes(schemaType)

const operationToPatches = createOperationToPatches(portableTextFeatures)

const {editor} = withPlugins(createEditor(), {
  portableTextEditor: new PortableTextEditor({schemaType} as PortableTextEditorProps),
  keyGenerator: defaultKeyGenerator,
  readOnly: false,
})

const createDefaultValue = () =>
  [
    {
      _type: 'myTestBlockType',
      _key: '1f2e64b47787',
      style: 'normal',
      markDefs: [],
      children: [
        {_type: 'span', _key: 'c130395c640c', text: '', marks: []},
        {
          _key: '773866318fa8',
          _type: 'someObject',
          value: {title: 'The Object'},
          __inline: true,
          children: [{_type: 'span', _key: 'bogus', text: '', marks: []}],
        },
        {_type: 'span', _key: 'fd9b4a4e6c0b', text: '', marks: []},
      ],
    },
  ] as Descendant[]

describe('operationToPatches', () => {
  beforeEach(() => {
    editor.children = createDefaultValue()
    editor.onChange()
  })

  it('translates void items correctly when splitting spans', () => {
    expect(
      operationToPatches.splitNodePatch(
        editor,
        {
          type: 'split_node',
          path: [0, 0],
          position: 0,
          properties: {_type: 'span', _key: 'c130395c640c', marks: []},
        },

        createDefaultValue()
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "items": Array [
            Object {
              "_key": "773866318fa8",
              "_type": "someObject",
              "title": "The Object",
            },
          ],
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
            "children",
            Object {
              "_key": "c130395c640c",
            },
          ],
          "position": "after",
          "type": "insert",
        },
        Object {
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
            "children",
            Object {
              "_key": "c130395c640c",
            },
            "text",
          ],
          "type": "set",
          "value": "",
        },
      ]
    `)
  })

  it('produce correct insert block patch', () => {
    expect(
      operationToPatches.insertNodePatch(
        editor,
        {
          type: 'insert_node',
          path: [0],
          node: {
            _type: 'someObject',
            _key: 'c130395c640c',
            value: {title: 'The Object'},
            __inline: false,
            children: [{_key: '1', _type: 'span', text: '', marks: []}],
          },
        },
        createDefaultValue()
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "items": Array [
            Object {
              "_key": "c130395c640c",
              "_type": "someObject",
              "title": "The Object",
            },
          ],
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
          ],
          "position": "before",
          "type": "insert",
        },
      ]
    `)
  })

  it('produce correct insert block patch with an empty editor', () => {
    editor.children = []
    editor.onChange()
    expect(
      operationToPatches.insertNodePatch(
        editor,
        {
          type: 'insert_node',
          path: [0],
          node: {
            _type: 'someObject',
            _key: 'c130395c640c',
            value: {},
            __inline: false,
            children: [{_key: '1', _type: 'span', text: '', marks: []}],
          },
        },

        []
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": Array [],
          "type": "setIfMissing",
          "value": Array [],
        },
        Object {
          "items": Array [
            Object {
              "_key": "c130395c640c",
              "_type": "someObject",
            },
          ],
          "path": Array [
            0,
          ],
          "position": "before",
          "type": "insert",
        },
      ]
    `)
  })

  it('produce correct insert child patch', () => {
    expect(
      operationToPatches.insertNodePatch(
        editor,
        {
          type: 'insert_node',
          path: [0, 3],
          node: {
            _type: 'someObject',
            _key: 'c130395c640c',
            value: {title: 'The Object'},
            __inline: true,
            children: [{_key: '1', _type: 'span', text: '', marks: []}],
          },
        },

        createDefaultValue()
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "items": Array [
            Object {
              "_key": "c130395c640c",
              "_type": "someObject",
              "title": "The Object",
            },
          ],
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
            "children",
            Object {
              "_key": "fd9b4a4e6c0b",
            },
          ],
          "position": "after",
          "type": "insert",
        },
      ]
    `)
  })

  it('produce correct insert text patch', () => {
    ;(editor.children[0] as PortableTextTextBlock).children[2].text = '1'
    editor.onChange()
    expect(
      operationToPatches.insertTextPatch(
        editor,
        {
          type: 'insert_text',
          path: [0, 2],
          text: '1',
          offset: 0,
        },

        createDefaultValue()
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
            "children",
            Object {
              "_key": "fd9b4a4e6c0b",
            },
            "text",
          ],
          "type": "diffMatchPatch",
          "value": "@@ -0,0 +1 @@
      +1
      ",
        },
      ]
    `)
  })

  it('produces correct remove text patch', () => {
    const before = createDefaultValue()
    ;(before[0] as PortableTextTextBlock).children[2].text = '1'
    expect(
      operationToPatches.removeTextPatch(
        editor,
        {
          type: 'remove_text',
          path: [0, 2],
          text: '1',
          offset: 1,
        },

        before
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
            "children",
            Object {
              "_key": "fd9b4a4e6c0b",
            },
            "text",
          ],
          "type": "diffMatchPatch",
          "value": "@@ -1 +0,0 @@
      -1
      ",
        },
      ]
    `)
  })

  it('produces correct remove child patch', () => {
    expect(
      operationToPatches.removeNodePatch(
        editor,
        {
          type: 'remove_node',
          path: [0, 1],
          node: {
            _key: '773866318fa8',
            _type: 'someObject',
            value: {title: 'The object'},
            __inline: true,
            children: [{_type: 'span', _key: 'bogus', text: '', marks: []}],
          },
        },

        createDefaultValue()
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
            "children",
            Object {
              "_key": "773866318fa8",
            },
          ],
          "type": "unset",
        },
      ]
    `)
  })

  it('produce correct remove block patch', () => {
    const val = createDefaultValue()
    expect(
      operationToPatches.removeNodePatch(
        editor,
        {
          type: 'remove_node',
          path: [0],
          node: val[0],
        },

        val
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
          ],
          "type": "unset",
        },
      ]
    `)
  })

  it('produce correct merge node patch', () => {
    const val = createDefaultValue()
    ;(val[0] as PortableTextTextBlock).children.push({
      _type: 'span',
      _key: 'r4wr323432',
      text: '1234',
      marks: [],
    })
    const block = editor.children[0] as PortableTextTextBlock
    block.children = block.children.splice(0, 3)
    block.children[2].text = '1234'
    editor.onChange()
    expect(
      operationToPatches.mergeNodePatch(
        editor,
        {
          type: 'merge_node',
          path: [0, 3],
          position: 2,
          properties: {text: '1234'},
        },

        val
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
            "children",
            Object {
              "_key": "fd9b4a4e6c0b",
            },
            "text",
          ],
          "type": "set",
          "value": "1234",
        },
        Object {
          "path": Array [
            Object {
              "_key": "1f2e64b47787",
            },
            "children",
            Object {
              "_key": "r4wr323432",
            },
          ],
          "type": "unset",
        },
      ]
    `)
  })
})
