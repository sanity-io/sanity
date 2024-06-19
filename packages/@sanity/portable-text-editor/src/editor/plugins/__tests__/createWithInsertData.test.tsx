import {describe, expect, it, jest} from '@jest/globals'
import {type Descendant} from 'slate'

import {
  type PortableTextMemberSchemaTypes,
  type PortableTextSlateEditor,
} from '../../../types/editor'
import {exportedForTesting} from '../createWithInsertData'

const initialValue = [
  {
    _key: 'a',
    _type: 'myTestBlockType',
    children: [
      {
        _key: 'a1',
        _type: 'span',
        marks: ['link1'],
        text: 'Block A',
      },
      {
        _key: 'a2',
        _type: 'span',
        marks: ['colour1'],
        text: 'Block B',
      },
    ],
    markDefs: [
      {
        _key: 'link1',
        _type: 'link',
        href: 'google.com',
        newTab: false,
      },
      {
        _key: 'colour1',
        _type: 'color',
        color: 'red',
      },
    ],
    style: 'normal',
  },
]

describe('plugin: createWithInsertData _regenerateKeys', () => {
  it('has MarkDefs that are allowed annotations', async () => {
    const {_regenerateKeys} = exportedForTesting
    const editorTypes = {annotations: [{name: 'color'}, {name: 'link'}]}
    const editor = {
      isTextBlock: jest.fn().mockReturnValue(true),
      isTextSpan: jest.fn().mockReturnValue(true),
    } as unknown as PortableTextSlateEditor

    const generatedValue = _regenerateKeys(
      editor,
      initialValue as Descendant[],
      jest.fn().mockReturnValue('') as () => string,
      'span',
      editorTypes as unknown as PortableTextMemberSchemaTypes,
    )

    // the keys are not important here as it's not what we are testing here
    expect(generatedValue).toStrictEqual([
      {
        _key: '',
        _type: 'myTestBlockType',
        children: [
          {_key: '', _type: 'span', marks: [''], text: 'Block A'},
          {
            _key: '',
            _type: 'span',
            marks: [''],
            text: 'Block B',
          },
        ],
        markDefs: [
          {_key: '', _type: 'link', href: 'google.com', newTab: false},
          {_key: '', _type: 'color', color: 'red'},
        ],
        style: 'normal',
      },
    ])
  })

  it('removes MarkDefs when no annotations are allowed', async () => {
    const {_regenerateKeys} = exportedForTesting
    const editorTypes = {annotations: []}
    const editor = {
      isTextBlock: jest.fn().mockReturnValue(true),
    } as unknown as PortableTextSlateEditor

    const generatedValue = _regenerateKeys(
      editor,
      initialValue as Descendant[],
      jest.fn().mockReturnValue('a1') as () => string,
      'span',
      editorTypes as unknown as PortableTextMemberSchemaTypes,
    )

    // orphaned children marks are removed later in the normalize function
    expect(generatedValue).toStrictEqual([
      {
        _key: 'a1',
        _type: 'myTestBlockType',
        children: [
          {_key: 'a1', _type: 'span', marks: ['link1'], text: 'Block A'},
          {
            _key: 'a2',
            _type: 'span',
            marks: ['colour1'],
            text: 'Block B',
          },
        ],
        style: 'normal',
      },
    ])
  })

  it('updates MarkDefs when one annotations is allowed but one is not allowed', async () => {
    const {_regenerateKeys} = exportedForTesting
    const editorTypes = {annotations: [{name: 'color'}]}
    const editor = {
      isTextBlock: jest.fn().mockReturnValue(true),
    } as unknown as PortableTextSlateEditor

    const generatedValue = _regenerateKeys(
      editor,
      initialValue as Descendant[],
      jest.fn().mockReturnValue('a1') as () => string,
      'span',
      editorTypes as unknown as PortableTextMemberSchemaTypes,
    )

    // orphaned children marks are removed later in the normalize function
    expect(generatedValue).toStrictEqual([
      {
        _key: 'a1',
        _type: 'myTestBlockType',
        children: [
          {_key: 'a1', _type: 'span', marks: ['link1'], text: 'Block A'},
          {
            _key: 'a2',
            _type: 'span',
            marks: ['colour1'],
            text: 'Block B',
          },
        ],
        markDefs: [{_key: 'colour1', _type: 'color', color: 'red'}],
        style: 'normal',
      },
    ])
  })
})
