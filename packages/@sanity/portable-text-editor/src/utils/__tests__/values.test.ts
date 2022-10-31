import {fromSlateValue, toSlateValue} from '../values'
import {type} from '../../editor/__tests__/PortableTextEditorTester'
import {getPortableTextMemberTypes} from '../getPortableTextMemberTypes'

const types = getPortableTextMemberTypes(type)

describe('toSlateValue', () => {
  it('checks undefined', () => {
    const result = toSlateValue(undefined, {types})
    expect(result).toHaveLength(0)
  })

  it('runs given empty array', () => {
    const result = toSlateValue([], {types})
    expect(result).toHaveLength(0)
  })

  it('given type is custom with no custom properties, should include an empty text property in children and an empty value', () => {
    const result = toSlateValue(
      [
        {
          _type: 'image',
          _key: '123',
        },
      ],
      {types}
    )

    expect(result).toMatchObject([
      {
        _key: '123',
        _type: 'image',
        children: [
          {
            text: '',
          },
        ],
        value: {},
      },
    ])
  })

  it('given type is block', () => {
    const result = toSlateValue(
      [
        {
          _type: types.block.name,
          _key: '123',
          children: [
            {
              _type: 'span',
              _key: '1231',
              text: '123',
            },
          ],
        },
      ],
      {types}
    )
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "123",
          "_type": "myTestBlockType",
          "children": Array [
            Object {
              "_key": "1231",
              "_type": "span",
              "text": "123",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })

  it('given type is block and has custom object in children', () => {
    const result = toSlateValue(
      [
        {
          _type: types.block.name,
          _key: '123',
          children: [
            {
              _type: 'span',
              _key: '1231',
              text: '123',
            },
            {
              _type: 'image',
              _key: '1232',
              asset: {
                _ref: 'ref-123',
              },
            },
          ],
        },
      ],
      {types}
    )
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "123",
          "_type": "myTestBlockType",
          "children": Array [
            Object {
              "_key": "1231",
              "_type": "span",
              "text": "123",
            },
            Object {
              "__inline": true,
              "_key": "1232",
              "_type": "image",
              "children": Array [
                Object {
                  "_key": "123-void-child",
                  "_type": "span",
                  "marks": Array [],
                  "text": "",
                },
              ],
              "value": Object {
                "asset": Object {
                  "_ref": "ref-123",
                },
              },
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })
})

describe('fromSlateValue', () => {
  it('runs given empty array', () => {
    const result = fromSlateValue([], 'image')
    expect(result).toHaveLength(0)
  })

  it('converts a slate value to portable text', () => {
    const ptValue = fromSlateValue(
      [
        {
          _type: 'block',
          _key: 'dr239u3',
          children: [
            {
              _type: 'span',
              _key: '252f4swet',
              marks: [],
              text: 'Hey ',
            },
            {
              _type: 'image',
              _key: 'e324t4s',
              __inline: true,
              children: [{_key: '1', _type: 'span', text: '', marks: []}],
              value: {
                _type: 'image',
                _key: 'e324t4s',
                asset: {_ref: '32423r32rewr3rwerwer'},
              },
            },
          ],
          markDefs: [],
          style: 'normal',
        },
        {
          _type: 'image',
          _key: 'wer32434',
          children: [{_key: '1', _type: 'span', text: '', marks: []}],
          value: {
            _type: 'image',
            _key: 'wer32434',
            asset: {_ref: 'werwer452423423'},
          },
        },
      ],
      'block'
    )
    expect(ptValue).toEqual([
      {
        _type: 'block',
        _key: 'dr239u3',
        children: [
          {
            _type: 'span',
            _key: '252f4swet',
            marks: [],
            text: 'Hey ',
          },
          {
            _type: 'image',
            _key: 'e324t4s',
            asset: {_ref: '32423r32rewr3rwerwer'},
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'image',
        _key: 'wer32434',
        asset: {_ref: 'werwer452423423'},
      },
    ])
  })

  it('has object equality', () => {
    const keyMap = {}
    const value = [
      {
        _type: 'image',
        _key: 'wer32434',
        asset: {_ref: 'werwer452423423'},
      },
      {
        _type: 'block',
        _key: 'dr239u3',
        children: [
          {
            _type: 'span',
            _key: '252f4swet',
            marks: [],
            text: 'Hey ',
          },
          {
            _type: 'image',
            _key: 'e324t4s',
            asset: {_ref: '32423r32rewr3rwerwer'},
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]
    const toSlate1 = toSlateValue(value, {types}, keyMap)
    const toSlate2 = toSlateValue(value, {types}, keyMap)
    expect(toSlate1[0]).toBe(toSlate2[0])
    expect(toSlate1[1]).toBe(toSlate2[1])
    const fromSlate1 = fromSlateValue(toSlate1, 'block', keyMap)
    const fromSlate2 = fromSlateValue(toSlate2, 'block', keyMap)
    expect(fromSlate1[0]).toBe(fromSlate2[0])
    expect(fromSlate1[1]).toBe(fromSlate2[1])
  })
})
