import {createPortableTextMemberSchemaTypes} from '@portabletext/sanity-bridge'
import {
  type ArraySchemaType,
  defineArrayMember,
  defineField,
  defineType,
  type PortableTextBlock,
} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../../schema'
import {resolveContainingArrayType} from './PortableTextMemberSchemaTypes'

// The root `body` array allows the `normal` style only; the `callout` container's
// `content` array allows `normal` plus a `code` style that exists nowhere at the
// root. Resolving member types for a block must walk to its containing array, so
// a container-nested block sees `code` and a root block does not.
const schema = createSchema({
  name: 'test',
  types: [
    defineType({
      name: 'testDoc',
      type: 'document',
      fields: [
        defineField({
          name: 'body',
          type: 'array',
          of: [
            defineArrayMember({type: 'block', styles: [{title: 'Normal', value: 'normal'}]}),
            defineArrayMember({
              type: 'object',
              name: 'callout',
              fields: [
                defineField({
                  name: 'content',
                  type: 'array',
                  of: [
                    defineArrayMember({
                      type: 'block',
                      styles: [
                        {title: 'Normal', value: 'normal'},
                        {title: 'Code', value: 'code'},
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

const bodyType = schema.get('testDoc')!.fields!.find((field) => field.name === 'body')!
  .type as ArraySchemaType

const value = [
  {
    _type: 'block',
    _key: 'b0',
    style: 'normal',
    children: [{_type: 'span', _key: 's0', text: 'root'}],
  },
  {
    _type: 'callout',
    _key: 'c0',
    content: [
      {
        _type: 'block',
        _key: 'cb0',
        style: 'code',
        children: [{_type: 'span', _key: 'cs0', text: 'nested'}],
      },
    ],
  },
]

function stylesFor(arrayType: ArraySchemaType): Array<string> {
  return createPortableTextMemberSchemaTypes(
    arrayType as ArraySchemaType<PortableTextBlock>,
  ).styles.map((style) => style.value)
}

describe('resolveContainingArrayType', () => {
  test('a root block resolves the root array, with root styles only', () => {
    const arrayType = resolveContainingArrayType(bodyType, [{_key: 'b0'}], value)
    expect(stylesFor(arrayType)).toEqual(['normal'])
  })

  test('a container-nested block resolves the container array, with its own styles', () => {
    const arrayType = resolveContainingArrayType(
      bodyType,
      [{_key: 'c0'}, 'content', {_key: 'cb0'}],
      value,
    )
    expect(stylesFor(arrayType)).toEqual(['normal', 'code'])
  })
})
