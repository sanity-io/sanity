/* eslint-disable max-nested-callbacks */
import {render, waitFor} from '@testing-library/react'

import React from 'react'
import {PortableTextEditor} from '../../PortableTextEditor'
import {
  PortableTextEditorTester,
  schemaType,
  schemaTypeWithColorAndLink,
} from '../../__tests__/PortableTextEditorTester'
import {EditorSelection} from '../../../types/editor'
import {defineType} from '@sanity/types'

describe('plugin:withPortableTextMarksModel', () => {
  describe('normalization', () => {
    it('merges adjacent spans correctly when removing annotations', async () => {
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
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })

      await waitFor(() => {
        if (editorRef.current) {
          PortableTextEditor.focus(editorRef.current)
          PortableTextEditor.select(editorRef.current, {
            focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: '11c8c9f783a8'}], offset: 4},
            anchor: {path: [{_key: '5fc57af23597'}, 'children', {_key: '11c8c9f783a8'}], offset: 0},
          })
          // eslint-disable-next-line max-nested-callbacks
          const linkType = editorRef.current.schemaTypes.annotations.find((a) => a.name === 'link')
          if (!linkType) {
            throw new Error('No link type found')
          }
          PortableTextEditor.removeAnnotation(editorRef.current, linkType)
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
        }
      })
    })

    it('splits correctly when adding marks', async () => {
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
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })
      await waitFor(() => {
        if (editorRef.current) {
          const editor = editorRef.current
          PortableTextEditor.focus(editor)
          PortableTextEditor.select(editor, {
            focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
            anchor: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 1},
          })
          PortableTextEditor.toggleMark(editor, 'bold')
          const value = PortableTextEditor.getValue(editor)
          expect(value).toMatchInlineSnapshot(`
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
        }
      })
    })
    it('merges children correctly when toggling marks in various ranges', async () => {
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
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })
      const editor = editorRef.current!
      expect(editor).toBeDefined()
      await waitFor(() => {
        PortableTextEditor.focus(editor)
        PortableTextEditor.select(editor, {
          focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
          anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 4},
        })
        PortableTextEditor.toggleMark(editor, 'bold')
        expect(PortableTextEditor.getValue(editor)).toMatchInlineSnapshot(`
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
      })
      await waitFor(() => {
        if (editorRef.current) {
          PortableTextEditor.select(editorRef.current, {
            focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 1},
            anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 3},
          })
          PortableTextEditor.toggleMark(editorRef.current, 'bold')
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
        }
      })
      await waitFor(() => {
        if (editor) {
          PortableTextEditor.select(editor, {
            focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
            anchor: {path: [{_key: 'a'}, 'children', {_key: '1'}], offset: 1},
          })
          PortableTextEditor.toggleMark(editor, 'bold')
          expect(PortableTextEditor.getValue(editor)).toMatchInlineSnapshot(`
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
        }
      })
    })
    it('toggles marks on children with annotation marks correctly', async () => {
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
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })
      const editor = editorRef.current!
      expect(editor).toBeDefined()

      await waitFor(() => {
        PortableTextEditor.focus(editor)
        PortableTextEditor.select(editor, {
          focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
          anchor: {path: [{_key: 'a'}, 'children', {_key: 'b1'}], offset: 12},
        })
        PortableTextEditor.toggleMark(editor, 'bold')
        expect(PortableTextEditor.getValue(editor)).toMatchInlineSnapshot(`
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

    it('merges blocks correctly when containing links', async () => {
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
          ],
          markDefs: [
            {
              _key: 'fde1fd54b544',
              _type: 'link',
              url: '1',
            },
          ],
          style: 'normal',
        },
        {
          _key: '7cd53af36712',
          _type: 'myTestBlockType',
          children: [
            {
              _key: '576c748e0cd2',
              _type: 'span',
              marks: [],
              text: 'This is ',
            },
            {
              _key: 'f3d73d3833bf',
              _type: 'span',
              marks: ['7b6d3d5de30c'],
              text: 'another',
            },
          ],
          markDefs: [
            {
              _key: '7b6d3d5de30c',
              _type: 'link',
              url: '2',
            },
          ],
          style: 'normal',
        },
      ]
      const sel: EditorSelection = {
        focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: '11c8c9f783a8'}], offset: 4},
        anchor: {path: [{_key: '7cd53af36712'}, 'children', {_key: '576c748e0cd2'}], offset: 0},
      }
      const onChange = jest.fn()
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })
      const editor = editorRef.current!
      expect(editor).toBeDefined()
      await waitFor(() => {
        PortableTextEditor.select(editor, sel)
        PortableTextEditor.delete(editor, sel)
        expect(PortableTextEditor.getValue(editor)).toMatchInlineSnapshot(`
        Array [
          Object {
            "_key": "5fc57af23597",
            "_type": "myTestBlockType",
            "children": Array [
              Object {
                "_key": "be1c67c6971a",
                "_type": "span",
                "marks": Array [],
                "text": "This is a ",
              },
              Object {
                "_key": "11c8c9f783a8",
                "_type": "span",
                "marks": Array [
                  "fde1fd54b544",
                ],
                "text": "link",
              },
              Object {
                "_key": "576c748e0cd2",
                "_type": "span",
                "marks": Array [],
                "text": "This is ",
              },
              Object {
                "_key": "f3d73d3833bf",
                "_type": "span",
                "marks": Array [
                  "7b6d3d5de30c",
                ],
                "text": "another",
              },
            ],
            "markDefs": Array [
              Object {
                "_key": "fde1fd54b544",
                "_type": "link",
                "url": "1",
              },
              Object {
                "_key": "7b6d3d5de30c",
                "_type": "link",
                "url": "2",
              },
            ],
            "style": "normal",
          },
        ]
      `)
      })
    })

    it('resets markDefs when splitting a block in the beginning', async () => {
      const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
      const initialValue = [
        {
          _key: '1987f99da4a2',
          _type: 'myTestBlockType',
          children: [
            {
              _key: '3693e789451c',
              _type: 'span',
              marks: [],
              text: '1',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
        {
          _key: '2f55670a03bb',
          _type: 'myTestBlockType',
          children: [
            {
              _key: '9f5ed7dee7ab',
              _type: 'span',
              marks: ['bab319ad3a9d'],
              text: '2',
            },
          ],
          markDefs: [
            {
              _key: 'bab319ad3a9d',
              _type: 'link',
              href: 'http://www.123.com',
            },
          ],
          style: 'normal',
        },
      ]
      const sel: EditorSelection = {
        focus: {path: [{_key: '2f55670a03bb'}, 'children', {_key: '9f5ed7dee7ab'}], offset: 0},
        anchor: {path: [{_key: '2f55670a03bb'}, 'children', {_key: '9f5ed7dee7ab'}], offset: 0},
      }
      const onChange = jest.fn()
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })

      const editor = editorRef.current!
      expect(editor).toBeDefined()

      await waitFor(() => {
        PortableTextEditor.select(editor, sel)
        PortableTextEditor.focus(editor)
        PortableTextEditor.insertBreak(editor)
        expect(PortableTextEditor.getValue(editor)).toMatchInlineSnapshot(`
        Array [
          Object {
            "_key": "1987f99da4a2",
            "_type": "myTestBlockType",
            "children": Array [
              Object {
                "_key": "3693e789451c",
                "_type": "span",
                "marks": Array [],
                "text": "1",
              },
            ],
            "markDefs": Array [],
            "style": "normal",
          },
          Object {
            "_key": "2f55670a03bb",
            "_type": "myTestBlockType",
            "children": Array [
              Object {
                "_key": "9f5ed7dee7ab",
                "_type": "span",
                "marks": Array [],
                "text": "",
              },
            ],
            "markDefs": Array [],
            "style": "normal",
          },
          Object {
            "_key": "2",
            "_type": "myTestBlockType",
            "children": Array [
              Object {
                "_key": "1",
                "_type": "span",
                "marks": Array [
                  "bab319ad3a9d",
                ],
                "text": "2",
              },
            ],
            "markDefs": Array [
              Object {
                "_key": "bab319ad3a9d",
                "_type": "link",
                "href": "http://www.123.com",
              },
            ],
            "style": "normal",
          },
        ]
      `)
      })
    })
  })
  describe('selection', () => {
    it('should emit a new selection object when toggling marks, even though the value is the same', async () => {
      const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
      const initialValue = [
        {
          _key: '1987f99da4a2',
          _type: 'myTestBlockType',
          children: [
            {
              _key: '3693e789451c',
              _type: 'span',
              marks: [],
              text: '',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ]
      const onChange = jest.fn()

      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })

      const editor = editorRef.current!
      expect(editor).toBeDefined()

      await waitFor(() => {
        PortableTextEditor.focus(editor)
      })
      const currentSelectionObject = PortableTextEditor.getSelection(editor)

      await waitFor(() => {
        PortableTextEditor.toggleMark(editor, 'strong')
      })
      const nextSelectionObject = PortableTextEditor.getSelection(editor)
      expect(currentSelectionObject).toEqual(nextSelectionObject)
      expect(currentSelectionObject === nextSelectionObject).toBe(false)
      expect(onChange).toHaveBeenCalledWith({type: 'selection', selection: nextSelectionObject})
    })
  })
  describe('removing annotations', () => {
    it('removes the markDefs if the annotation is no longer in use', async () => {
      const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
      const initialValue = [
        {
          _key: '5fc57af23597',
          _type: 'myTestBlockType',
          children: [
            {
              _key: 'be1c67c6971a',
              _type: 'span',
              marks: ['fde1fd54b544'],
              text: 'This is a link',
            },
          ],
          markDefs: [
            {
              _key: 'fde1fd54b544',
              _type: 'link',
              url: '1',
            },
          ],
          style: 'normal',
        },
      ]
      const onChange = jest.fn()
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })

      await waitFor(() => {
        if (editorRef.current) {
          PortableTextEditor.focus(editorRef.current)
          PortableTextEditor.select(editorRef.current, {
            focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}], offset: 14},
            anchor: {path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}], offset: 0},
          })
          // // eslint-disable-next-line max-nested-callbacks
          const linkType = editorRef.current.schemaTypes.annotations.find((a) => a.name === 'link')
          if (!linkType) {
            throw new Error('No link type found')
          }
          PortableTextEditor.removeAnnotation(editorRef.current, linkType)
          expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
            {
              _key: '5fc57af23597',
              _type: 'myTestBlockType',
              children: [
                {
                  _key: 'be1c67c6971a',
                  _type: 'span',
                  marks: [],
                  text: 'This is a link',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ])
        }
      })
    })
    it('preserves the markDefs if the annotation will continue in use', async () => {
      const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
      const initialValue = [
        {
          _key: '5fc57af23597',
          _type: 'myTestBlockType',
          children: [
            {
              _key: 'be1c67c6971a',
              _type: 'span',
              marks: ['fde1fd54b544'],
              text: 'This is a link',
            },
          ],
          markDefs: [
            {
              _key: 'fde1fd54b544',
              _type: 'link',
              url: '1',
            },
          ],
          style: 'normal',
        },
      ]
      const onChange = jest.fn()
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })

      await waitFor(() => {
        if (editorRef.current) {
          PortableTextEditor.focus(editorRef.current)
          PortableTextEditor.select(editorRef.current, {
            focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}], offset: 10},
            anchor: {
              path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}],
              offset: 0,
            },
          })
          // // eslint-disable-next-line max-nested-callbacks
          const linkType = editorRef.current.schemaTypes.annotations.find((a) => a.name === 'link')
          if (!linkType) {
            throw new Error('No link type found')
          }
          PortableTextEditor.removeAnnotation(editorRef.current, linkType)
          expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
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
                  _key: '1',
                  marks: ['fde1fd54b544'],
                  _type: 'span',
                  text: 'link',
                },
              ],
              markDefs: [
                {
                  _key: 'fde1fd54b544',
                  _type: 'link',
                  url: '1',
                },
              ],
              style: 'normal',
            },
          ])
        }
      })
    })
    it('removes the mark from the correct place', async () => {
      const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
      const initialValue = [
        {
          _key: '5fc57af23597',
          _type: 'myTestBlockType',
          children: [
            {
              _key: 'be1c67c6971a',
              _type: 'span',
              marks: ['fde1fd54b544'],
              text: 'This is a link',
            },
          ],
          markDefs: [
            {
              _key: 'fde1fd54b544',
              _type: 'link',
              url: '1',
            },
          ],
          style: 'normal',
        },
      ]
      const onChange = jest.fn()
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaType}
            value={initialValue}
          />,
        )
      })

      await waitFor(() => {
        if (editorRef.current) {
          PortableTextEditor.focus(editorRef.current)
          // Selects `a link` from `This is a link`, so the mark should be kept in the first span.
          PortableTextEditor.select(editorRef.current, {
            focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}], offset: 14},
            anchor: {
              path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}],
              offset: 8,
            },
          })

          // // eslint-disable-next-line max-nested-callbacks
          const linkType = editorRef.current.schemaTypes.annotations.find((a) => a.name === 'link')
          if (!linkType) {
            throw new Error('No link type found')
          }
          PortableTextEditor.removeAnnotation(editorRef.current, linkType)
          expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
            {
              _key: '5fc57af23597',
              _type: 'myTestBlockType',
              children: [
                {
                  _key: 'be1c67c6971a',
                  _type: 'span',
                  marks: ['fde1fd54b544'],
                  text: 'This is ',
                },
                {
                  _key: '1',
                  _type: 'span',
                  marks: [],
                  text: 'a link',
                },
              ],
              markDefs: [
                {
                  _key: 'fde1fd54b544',
                  _type: 'link',
                  url: '1',
                },
              ],
              style: 'normal',
            },
          ])
        }
      })
    })
    it('preserves other marks that apply to the spans', async () => {
      const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
      const initialValue = [
        {
          _key: '5fc57af23597',
          _type: 'myTestBlockType',
          children: [
            {
              _key: 'be1c67c6971a',
              _type: 'span',
              marks: ['fde1fd54b544', '7b6d3d5de30c'],
              text: 'This is a link',
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
              _type: 'color',
              color: 'blue',
            },
          ],
          style: 'normal',
        },
      ]
      const onChange = jest.fn()
      await waitFor(() => {
        render(
          <PortableTextEditorTester
            onChange={onChange}
            ref={editorRef}
            schemaType={schemaTypeWithColorAndLink}
            value={initialValue}
          />,
        )
      })

      await waitFor(() => {
        if (editorRef.current) {
          PortableTextEditor.focus(editorRef.current)
          // Selects `a link` from `This is a link`, so the mark should be kept in the first span, color mark in both.
          PortableTextEditor.select(editorRef.current, {
            focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}], offset: 14},
            anchor: {
              path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}],
              offset: 8,
            },
          })

          // // eslint-disable-next-line max-nested-callbacks
          const linkType = editorRef.current.schemaTypes.annotations.find((a) => a.name === 'link')
          if (!linkType) {
            throw new Error('No link type found')
          }
          PortableTextEditor.removeAnnotation(editorRef.current, linkType)
          expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
            {
              _key: '5fc57af23597',
              _type: 'myTestBlockType',
              children: [
                {
                  _key: 'be1c67c6971a',
                  _type: 'span',
                  marks: ['fde1fd54b544', '7b6d3d5de30c'], // It has both marks, the link was only removed from the second span
                  text: 'This is ',
                },
                {
                  _key: '1',
                  _type: 'span',
                  marks: ['7b6d3d5de30c'],
                  text: 'a link',
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
                  _type: 'color',
                  color: 'blue',
                },
              ],
              style: 'normal',
            },
          ])

          // removes the color from both
          PortableTextEditor.select(editorRef.current, {
            focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: '1'}], offset: 6},
            anchor: {
              path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}],
              offset: 0,
            },
          })
          const colorType = editorRef.current.schemaTypes.annotations.find(
            (a) => a.name === 'color',
          )
          if (!colorType) {
            throw new Error('No color type found')
          }

          PortableTextEditor.removeAnnotation(editorRef.current, colorType)

          expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
            {
              _key: '5fc57af23597',
              _type: 'myTestBlockType',
              children: [
                {
                  _key: 'be1c67c6971a',
                  _type: 'span',
                  marks: ['fde1fd54b544'], // The color was removed from both
                  text: 'This is ',
                },
                {
                  _key: '1',
                  _type: 'span',
                  marks: [], // The color was removed from both
                  text: 'a link',
                },
              ],
              markDefs: [
                {
                  _key: 'fde1fd54b544',
                  _type: 'link',
                  url: '1',
                },
              ],
              style: 'normal',
            },
          ])
        }
      })
    })
  })
})
