import {createEditor, Descendant} from 'slate'
import {noop} from 'lodash'
import {createRef} from 'react'
import {schemaType} from '../../editor/__tests__/PortableTextEditorTester'
import {createPatchToOperations} from '../patchToOperations'
import {withPlugins} from '../../editor/plugins'
import {keyGenerator, Patch, PortableTextEditor} from '../..'
import {fromSlateValue} from '../values'
import {getPortableTextMemberSchemaTypes} from '../getPortableTextMemberSchemaTypes'

const schemaTypes = getPortableTextMemberSchemaTypes(schemaType)

const patchToOperations = createPatchToOperations(schemaTypes)
const portableTextEditor = new PortableTextEditor({schemaType, onChange: noop})
const isPending: React.MutableRefObject<boolean | null> = createRef()
isPending.current = false

const {editor} = withPlugins(createEditor(), {
  portableTextEditor,
  keyGenerator,
  readOnly: false,
  isPending,
})

const createDefaultValue = (): Descendant[] => [
  {
    _type: 'image',
    _key: 'c01739b0d03b',
    children: [
      {
        _key: 'c01739b0d03b-void-child',
        _type: 'span',
        text: '',
        marks: [],
      },
    ],
    __inline: false,
    value: {
      asset: {
        _ref: 'image-f52f71bc1df46e080dabe43a8effe8ccfb5f21de-4032x3024-png',
        _type: 'reference',
      },
    },
  },
]

describe('operationToPatches', () => {
  beforeEach(() => {
    editor.children = createDefaultValue()
    editor.onChange()
  })

  it('makes the correct operations for block objects', () => {
    const patches = [
      {type: 'unset', path: [{_key: 'c01739b0d03b'}, 'hotspot'], origin: 'remote'},
      {type: 'unset', path: [{_key: 'c01739b0d03b'}, 'crop'], origin: 'remote'},
      {
        type: 'set',
        path: [{_key: 'c01739b0d03b'}, 'asset'],
        value: {
          _ref: 'image-b5681d9d0b2b6c922238e7c694500dd7c1349b19-256x256-jpg',
          _type: 'reference',
        },
        origin: 'remote',
      },
    ] as Patch[]
    const snapShot = fromSlateValue(editor.children, schemaTypes.block.name)
    patches.forEach((p) => {
      patchToOperations(editor, p, patches, snapShot)
    })
    expect(editor.children).toMatchInlineSnapshot(`
      Array [
        Object {
          "__inline": false,
          "_key": "c01739b0d03b",
          "_type": "image",
          "children": Array [
            Object {
              "_key": "c01739b0d03b-void-child",
              "_type": "span",
              "marks": Array [],
              "text": "",
            },
          ],
          "value": Object {
            "asset": Object {
              "_ref": "image-f52f71bc1df46e080dabe43a8effe8ccfb5f21de-4032x3024-png",
              "_type": "reference",
            },
          },
        },
      ]
    `)
  })
})
