import {describe, expect, it, jest} from '@jest/globals'
/* eslint-disable max-nested-callbacks */
import {render, waitFor} from '@testing-library/react'
import {createRef, type RefObject} from 'react'

import {PortableTextEditorTester, schemaType} from '../../__tests__/PortableTextEditorTester'
import {PortableTextEditor} from '../../PortableTextEditor'

describe('plugin:withPlaceholderBlock', () => {
  describe('removing nodes', () => {
    it("should insert an empty text block if it's removing the only block", async () => {
      const editorRef: RefObject<PortableTextEditor> = createRef()
      const initialValue = [
        {
          _key: '5fc57af23597',
          _type: 'someObject',
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

          PortableTextEditor.delete(
            editorRef.current,
            {
              focus: {path: [{_key: '5fc57af23597'}], offset: 0},
              anchor: {path: [{_key: '5fc57af23597'}], offset: 0},
            },
            {mode: 'blocks'},
          )

          const value = PortableTextEditor.getValue(editorRef.current)

          expect(value).toEqual([
            {
              _type: 'myTestBlockType',
              _key: '3',
              style: 'normal',
              markDefs: [],
              children: [
                {
                  _type: 'span',
                  _key: '2',
                  text: '',
                  marks: [],
                },
              ],
            },
          ])
        }
      })
    })
    it('should not insert a new block if we have more blocks available', async () => {
      const editorRef: RefObject<PortableTextEditor> = createRef()
      const initialValue = [
        {
          _key: '5fc57af23597',
          _type: 'someObject',
        },
        {
          _type: 'myTestBlockType',
          _key: 'existingBlock',
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: '2',
              text: '',
              marks: [],
            },
          ],
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

          PortableTextEditor.delete(
            editorRef.current,
            {
              focus: {path: [{_key: '5fc57af23597'}], offset: 0},
              anchor: {path: [{_key: '5fc57af23597'}], offset: 0},
            },
            {mode: 'blocks'},
          )

          const value = PortableTextEditor.getValue(editorRef.current)
          expect(value).toEqual([
            {
              _type: 'myTestBlockType',
              _key: 'existingBlock',
              style: 'normal',
              markDefs: [],
              children: [
                {
                  _type: 'span',
                  _key: '2',
                  text: '',
                  marks: [],
                },
              ],
            },
          ])
        }
      })
    })
  })
})
