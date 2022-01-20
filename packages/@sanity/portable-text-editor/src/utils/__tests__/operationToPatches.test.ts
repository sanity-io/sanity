import {createEditor, Descendant} from 'slate'
import {Subject} from 'rxjs'
import {getPortableTextFeatures} from '../getPortableTextFeatures'
import {type} from '../../editor/__tests__/PortableTextEditorTester'
import {createOperationToPatches} from '../operationToPatches'
import {withPortableText} from '../../editor/withPortableText'
import {keyGenerator} from '../..'

const portableTextFeatures = getPortableTextFeatures(type)

const operationToPatches = createOperationToPatches(portableTextFeatures)
const editor = withPortableText(createEditor(), {
  portableTextFeatures,
  keyGenerator,
  change$: new Subject(),
  readOnly: false,
})

const defaultValue = [
  {
    _type: 'myTestBlockType',
    _key: '1f2e64b47787',
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: 'c130395c640c', text: '', marks: []},
      {_key: '773866318fa8', _type: 'someObject', value: {title: 'The Object'}, __inline: true},
      {_type: 'span', _key: 'fd9b4a4e6c0b', text: '', marks: []},
    ],
  },
] as Descendant[]

describe('operationToPatches', () => {
  beforeEach(() => {
    editor.children = defaultValue
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

        defaultValue
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
})
