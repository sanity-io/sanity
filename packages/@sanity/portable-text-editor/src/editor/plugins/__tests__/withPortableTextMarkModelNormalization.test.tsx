/**
 * @jest-environment ./test/setup/jsdom.jest.env.ts
 */
// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {act} from 'react-dom/test-utils'
import {render} from '@testing-library/react'

import React from 'react'
import {PortableTextEditor} from '../../PortableTextEditor'
import {PortableTextEditorTester, type} from '../../../editor/__tests__/PortableTextEditorTester'

describe('plugin:withPortableTextMarksModel: normalization', () => {
  it('merges adjacent spans correctly when removing annotations', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [
      {
        _key: '5fc57af23597',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'be1c67c6971a',
            _type: 'span',
            marks: [],
            text: 'This is a ',
          },
          {
            _key: '11c8c9f783a8',
            _type: 'span',
            marks: ['fde1fd54b544'],
            text: 'link',
          },
          {
            _key: '576c748e0cd2',
            _type: 'span',
            marks: [],
            text: ', this is ',
          },
          {
            _key: 'f3d73d3833bf',
            _type: 'span',
            marks: ['7b6d3d5de30c'],
            text: 'another',
          },
          {
            _key: '73b01f13c2ec',
            _type: 'span',
            marks: [],
            text: ', and this is ',
          },
          {
            _key: '13eb0d467c82',
            _type: 'span',
            marks: ['93a1d24eade0'],
            text: 'a third',
          },
        ],
        markDefs: [
          {
            _key: 'fde1fd54b544',
            _type: 'link',
            url: '1',
          },
          {
            _key: '7b6d3d5de30c',
            _type: 'link',
            url: '2',
          },
          {
            _key: '93a1d24eade0',
            _type: 'link',
            url: '3',
          },
        ],
        style: 'normal',
      },
    ]
    const onChange = jest.fn()
    act(() => {
      render(
        <PortableTextEditorTester
          onChange={onChange}
          ref={editorRef}
          type={type}
          value={initialValue}
        />
      )
    })
    if (!editorRef.current) {
      throw new Error('No editor')
    }
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: '11c8c9f783a8'}], offset: 4},
          anchor: {path: [{_key: '5fc57af23597'}, 'children', {_key: '11c8c9f783a8'}], offset: 0},
        })
      }
    })
    const linkType = PortableTextEditor.getPortableTextFeatures(editorRef.current).annotations.find(
      (a) => a.type.name === 'link'
    )?.type
    if (!linkType) {
      throw new Error('No link type found')
    }
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.removeAnnotation(editorRef.current, linkType)
      }
    })
    expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
      {
        _key: '5fc57af23597',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'be1c67c6971a',
            _type: 'span',
            marks: [],
            text: 'This is a link, this is ',
          },
          {
            _key: 'f3d73d3833bf',
            _type: 'span',
            marks: ['7b6d3d5de30c'],
            text: 'another',
          },
          {
            _key: '73b01f13c2ec',
            _type: 'span',
            marks: [],
            text: ', and this is ',
          },
          {
            _key: '13eb0d467c82',
            _type: 'span',
            marks: ['93a1d24eade0'],
            text: 'a third',
          },
        ],
        markDefs: [
          {
            _key: '7b6d3d5de30c',
            _type: 'link',
            url: '2',
          },
          {
            _key: '93a1d24eade0',
            _type: 'link',
            url: '3',
          },
        ],
        style: 'normal',
      },
    ])
  })

  it('splits correctly when adding marks', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [
      {
        _key: 'a',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'a1',
            _type: 'span',
            marks: [],
            text: '123',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _key: 'b',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'b1',
            _type: 'span',
            marks: [],
            text: '123',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]
    const onChange = jest.fn()
    act(() => {
      render(
        <PortableTextEditorTester
          onChange={onChange}
          ref={editorRef}
          type={type}
          value={initialValue}
        />
      )
    })
    if (!editorRef.current) {
      throw new Error('No editor')
    }
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
          anchor: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 1},
        })
      }
    })
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.toggleMark(editorRef.current, 'bold')
      }
    })
    expect(PortableTextEditor.getValue(editorRef.current)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "a",
          "_type": "myTestBlockType",
          "children": Array [
            Object {
              "_key": "a1",
              "_type": "span",
              "marks": Array [
                "bold",
              ],
              "text": "123",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
        Object {
          "_key": "b",
          "_type": "myTestBlockType",
          "children": Array [
            Object {
              "_key": "b1",
              "_type": "span",
              "marks": Array [
                "bold",
              ],
              "text": "1",
            },
            Object {
              "_key": "1",
              "_type": "span",
              "marks": Array [],
              "text": "23",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })
  it('merges children correctly when toggling marks in various ranges', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [
      {
        _key: 'a',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'a1',
            _type: 'span',
            marks: [],
            text: '1234',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]
    const onChange = jest.fn()
    act(() => {
      render(
        <PortableTextEditorTester
          onChange={onChange}
          ref={editorRef}
          type={type}
          value={initialValue}
        />
      )
    })
    if (!editorRef.current) {
      throw new Error('No editor')
    }
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
          anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 4},
        })
      }
    })
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.toggleMark(editorRef.current, 'bold')
      }
    })
    expect(PortableTextEditor.getValue(editorRef.current)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "a",
          "_type": "myTestBlockType",
          "children": Array [
            Object {
              "_key": "a1",
              "_type": "span",
              "marks": Array [
                "bold",
              ],
              "text": "1234",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 1},
          anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 3},
        })
        PortableTextEditor.toggleMark(editorRef.current, 'bold')
      }
    })
    expect(PortableTextEditor.getValue(editorRef.current)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "a",
          "_type": "myTestBlockType",
          "children": Array [
            Object {
              "_key": "a1",
              "_type": "span",
              "marks": Array [
                "bold",
              ],
              "text": "1",
            },
            Object {
              "_key": "2",
              "_type": "span",
              "marks": Array [],
              "text": "23",
            },
            Object {
              "_key": "1",
              "_type": "span",
              "marks": Array [
                "bold",
              ],
              "text": "4",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
          anchor: {path: [{_key: 'a'}, 'children', {_key: '1'}], offset: 1},
        })
        PortableTextEditor.toggleMark(editorRef.current, 'bold')
      }
    })
    expect(PortableTextEditor.getValue(editorRef.current)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "a",
          "_type": "myTestBlockType",
          "children": Array [
            Object {
              "_key": "a1",
              "_type": "span",
              "marks": Array [],
              "text": "1234",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })
  it('toggles marks on children with annotation marks correctly', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [
      {
        _key: 'a',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'a1',
            _type: 'span',
            marks: ['abc'],
            text: 'A link',
          },
          {
            _key: 'a2',
            _type: 'span',
            marks: [],
            text: ', not a link',
          },
        ],
        markDefs: [
          {
            _type: 'link',
            _key: 'abc',
            href: 'http://www.link.com',
          },
        ],
        style: 'normal',
      },
    ]
    const onChange = jest.fn()
    act(() => {
      render(
        <PortableTextEditorTester
          onChange={onChange}
          ref={editorRef}
          type={type}
          value={initialValue}
        />
      )
    })
    if (!editorRef.current) {
      throw new Error('No editor')
    }
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
          anchor: {path: [{_key: 'a'}, 'children', {_key: 'b1'}], offset: 12},
        })
      }
    })
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.toggleMark(editorRef.current, 'bold')
      }
    })
    expect(PortableTextEditor.getValue(editorRef.current)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_key": "a",
          "_type": "myTestBlockType",
          "children": Array [
            Object {
              "_key": "a1",
              "_type": "span",
              "marks": Array [
                "abc",
                "bold",
              ],
              "text": "A link",
            },
            Object {
              "_key": "a2",
              "_type": "span",
              "marks": Array [
                "bold",
              ],
              "text": ", not a link",
            },
          ],
          "markDefs": Array [
            Object {
              "_key": "abc",
              "_type": "link",
              "href": "http://www.link.com",
            },
          ],
          "style": "normal",
        },
      ]
    `)
  })
})
