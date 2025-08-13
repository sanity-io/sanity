import {
  defineField,
  type FieldGroupDefinition,
  type FieldsetDefinition,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {type ReactNode} from 'react'
import {assert, describe, expect, test} from 'vitest'

import {
  type EncodedNamedType,
  type ObjectField,
} from '../../../@sanity/schema/src/descriptors/types'
import {builtinSchema, createSchema} from '../../src/core/schema/createSchema'
import {DESCRIPTOR_CONVERTER} from '../../src/core/schema/descriptors'

const findTypeInDesc = (
  name: string,
  descriptor: ReturnType<(typeof DESCRIPTOR_CONVERTER)['get']>,
) =>
  Object.values(descriptor.objectValues).find((val) => val.name === name) as
    | EncodedNamedType
    | undefined

const convertType = (...types: SchemaTypeDefinition[]): EncodedNamedType => {
  const schema = createSchema({name: 'custom', types})
  if (schema._validation?.length) {
    throw new Error(
      `Test contains invalid schema definition: ${JSON.stringify(schema._validation, null, 2)}`,
    )
  }

  const desc = DESCRIPTOR_CONVERTER.get(schema)
  return findTypeInDesc(types[0].name, desc)!
}

describe('Built-in schema', () => {
  const descriptor = DESCRIPTOR_CONVERTER.get(builtinSchema)
  const findType = (name: string) => findTypeInDesc(name, descriptor)

  test('Object', () => {
    const obj = findType('object')
    assert(obj)
    expect(obj.typeDef.jsonType).toBe('object')
    expect(obj.typeDef.title).toBe('Object')
  })
})

describe('Base features', () => {
  describe('title', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        title: undefined,
      })
    })

    test('string', () => {
      expect(convertType({name: 'foo', type: 'string', title: 'Hello'}).typeDef).toMatchObject({
        title: 'Hello',
      })
    })
  })

  describe('description', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        description: undefined,
      })
    })

    test('string', () => {
      expect(
        convertType({name: 'foo', type: 'string', description: 'Hello'}).typeDef,
      ).toMatchObject({
        description: 'Hello',
      })
    })

    test('non-string', () => {
      expect(
        convertType({name: 'foo', type: 'string', description: 123 as unknown as string}).typeDef,
      ).toMatchObject({
        description: undefined,
      })
    })

    test('JSX', () => {
      expect(
        convertType({name: 'foo', type: 'string', description: <div>Hello</div>}).typeDef,
      ).toMatchObject({
        description: {__type: 'jsx', type: 'div', props: {children: 'Hello'}},
      })
    })

    test('custom JSX', () => {
      function Foo({bar, children}: {bar: number; children: ReactNode}) {
        return (
          <div>
            {bar} and {children}
          </div>
        )
      }

      expect(
        convertType({
          name: 'foo',
          type: 'string',
          description: (
            <Foo bar={1}>
              Hello <br /> <strong>world</strong>
            </Foo>
          ),
        }).typeDef,
      ).toMatchObject({
        description: {
          __type: 'jsx',
          type: 'Foo',
          props: {
            bar: {__type: 'number', value: '1'},
            children: [
              'Hello ',
              {__type: 'jsx', type: 'br', props: {}},
              ' ',
              {__type: 'jsx', type: 'strong', props: {children: 'world'}},
            ],
          },
        },
      })
    })
  })

  describe('readOnly', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        readOnly: undefined,
      })
    })

    test('true', () => {
      expect(convertType({name: 'foo', type: 'string', readOnly: true}).typeDef).toMatchObject({
        readOnly: true,
      })
    })

    test('false', () => {
      expect(convertType({name: 'foo', type: 'string', readOnly: false}).typeDef).toMatchObject({
        readOnly: undefined,
      })
    })

    test('non-boolean', () => {
      expect(
        convertType({name: 'foo', type: 'string', readOnly: 123 as unknown as boolean}).typeDef,
      ).toMatchObject({
        readOnly: undefined,
      })
    })

    test('conditional', () => {
      expect(
        convertType({name: 'foo', type: 'string', readOnly: () => true}).typeDef,
      ).toMatchObject({
        readOnly: {__type: 'function'},
      })
    })
  })

  describe('hidden', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        hidden: undefined,
      })
    })

    test('true', () => {
      expect(convertType({name: 'foo', type: 'string', hidden: true}).typeDef).toMatchObject({
        hidden: true,
      })
    })

    test('false', () => {
      expect(convertType({name: 'foo', type: 'string', hidden: false}).typeDef).toMatchObject({
        hidden: undefined,
      })
    })

    test('non-boolean', () => {
      expect(
        convertType({name: 'foo', type: 'string', hidden: 123 as unknown as boolean}).typeDef,
      ).toMatchObject({
        hidden: undefined,
      })
    })

    test('conditional', () => {
      expect(convertType({name: 'foo', type: 'string', hidden: () => true}).typeDef).toMatchObject({
        hidden: {__type: 'function'},
      })
    })
  })

  describe('options', () => {
    test('undefined', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
        }).typeDef,
      ).toMatchObject({options: undefined})
    })

    test('primitives', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            a: true,
            b: false,
            c: 'hello',
            d: null,
            e: [true],
          } as object,
        }).typeDef,
      ).toMatchObject({options: {a: true, b: false, c: 'hello', d: null, e: [true]}})
    })

    test('numbers', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            a: 123,
          } as object,
        }).typeDef,
      ).toMatchObject({options: {a: {__type: 'number', value: '123'}}})
    })

    test('function', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            a: () => {},
          } as object,
        }).typeDef,
      ).toMatchObject({options: {a: {__type: 'function'}}})
    })

    test('cyclic', () => {
      const val: Record<string, unknown> = {}
      val.a = {b: val}
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            val,
          } as object,
        }).typeDef,
      ).toMatchObject({options: {val: {a: {b: {__type: 'cyclic'}}}}})
    })

    test('object with __type', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            foo: {__type: 'yes'},
          } as object,
        }).typeDef,
      ).toMatchObject({options: {foo: {__type: 'object', value: {__type: 'yes'}}}})
    })

    test('max depth', () => {
      const val = {a: {b: {c: {d: {e: {f: {}}}}}}}
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            val,
          } as object,
        }).typeDef,
      ).toMatchObject({options: {val: {a: {b: {c: {d: {__type: 'maxDepth'}}}}}}})
    })
  })

  describe('initialValue', () => {
    // NOTE: We don't have much coverage here, but this is being handled the exact same way as `options`.
    // We should consider refactoring these tests to be able to cover it here as well.

    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        initialValue: undefined,
      })
    })

    test('string', () => {
      expect(
        convertType({name: 'foo', type: 'string', initialValue: 'hello'}).typeDef,
      ).toMatchObject({
        initialValue: 'hello',
      })
    })
  })

  describe('deprecated', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        deprecated: undefined,
      })
    })

    test('with reason', () => {
      expect(
        convertType({name: 'foo', type: 'string', deprecated: {reason: 'Hello'}}).typeDef,
      ).toMatchObject({
        deprecated: {reason: 'Hello'},
      })
    })

    test('without reason', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          deprecated: {REASON: 'Hello'} as unknown as {reason: string},
        }).typeDef,
      ).toMatchObject({
        deprecated: undefined,
      })
    })

    test('with non-object', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          deprecated: 123 as unknown as {reason: string},
        }).typeDef,
      ).toMatchObject({
        deprecated: undefined,
      })
    })

    test('with non-string reason', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          deprecated: {reason: 123} as unknown as {reason: string},
        }).typeDef,
      ).toMatchObject({
        deprecated: undefined,
      })
    })
  })

  describe('placeholder', () => {
    test('undefined', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
        }).typeDef,
      ).toMatchObject({
        placeholder: undefined,
      })
    })

    test('string', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          placeholder: 'Holder of Place',
        }).typeDef,
      ).toMatchObject({
        placeholder: 'Holder of Place',
      })
    })

    test('non-string', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          placeholder: 123 as unknown as string,
        }).typeDef,
      ).toMatchObject({
        placeholder: undefined,
      })
    })
  })

  test.todo('validation')
})

describe('Document', () => {
  describe('liveEdit', () => {
    test('undefined', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        }).typeDef,
      ).toMatchObject({
        liveEdit: undefined,
      })
    })
    test('true', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
          liveEdit: true,
        }).typeDef,
      ).toMatchObject({
        liveEdit: true,
      })
    })

    test('false', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
          liveEdit: false,
        }).typeDef,
      ).toMatchObject({
        liveEdit: undefined,
      })
    })

    test('non-boolean', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
          liveEdit: 123 as unknown as boolean,
        }).typeDef,
      ).toMatchObject({
        liveEdit: undefined,
      })
    })
  })
})

describe('Object', () => {
  test('fields', () => {
    // We place all the fields + the assertions for each converted field here.
    const fieldTests: Array<{field: any; assert: (field: ObjectField) => void}> = [
      {
        field: defineField({
          name: 'name',
          type: 'string',
        }),

        assert(field) {
          expect(field).toMatchObject({
            name: 'name',
            groups: undefined,
            fieldset: undefined,
          })
        },
      },
      {
        field: defineField({
          name: 'name2',
          type: 'string',
          group: 'a',
        }),
        assert(field) {
          expect(field).toMatchObject({
            name: 'name2',
            groups: ['a'],
            fieldset: undefined,
          })
        },
      },
      {
        field: defineField({
          name: 'name3',
          type: 'string',
          group: ['a', 'b'],
        }),
        assert(field) {
          expect(field).toMatchObject({
            name: 'name3',
            groups: ['a', 'b'],
            fieldset: undefined,
          })
        },
      },
      {
        field: defineField({
          name: 'name4',
          type: 'string',
          fieldset: 'f',
        }),

        assert(field) {
          expect(field).toMatchObject({
            name: 'name4',
            groups: undefined,
            fieldset: 'f',
          })
        },
      },
      {
        // Also check that other props are forwarded to the type:
        field: defineField({
          name: 'name5',
          type: 'string',
          hidden: true,
        }),

        assert(field) {
          expect(field.typeDef.hidden).toBe(true)
        },
      },
    ]

    const desc = convertType({
      name: 'person',
      type: 'object',
      fieldsets: [{name: 'f', title: 'Fieldset F'}],
      groups: [
        {name: 'a', title: 'Group A'},
        {name: 'b', title: 'Group B'},
      ],
      fields: fieldTests.map(({field}) => field),
    })

    expect(desc.typeDef.extends).toBe('object')
    assert(desc.typeDef.fields)
    expect(desc.typeDef.fields).toHaveLength(fieldTests.length)

    let i = 0
    for (const field of desc.typeDef.fields) {
      fieldTests[i].assert(field)
      i++
    }
  })

  describe('fieldsets', () => {
    test('ordering', () => {
      expect(
        convertType({
          name: 'person',
          type: 'object',
          fieldsets: [{name: 'b'}, {name: 'a'}],
          fields: [{name: 'title', type: 'string'}],
        }).typeDef.fieldsets,
      ).toMatchObject([{name: 'b'}, {name: 'a'}])
    })

    test.each<[string, FieldsetDefinition, unknown]>([
      [
        'only name',
        {name: 'f'},
        {
          name: 'f',
          title: undefined,
          description: undefined,
          group: undefined,
          hidden: undefined,
          readOnly: undefined,
          options: undefined,
        },
      ],
      ['title', {name: 'f', title: 'Hello'}, {name: 'f', title: 'Hello'}],
      [
        'title wrong type',
        {name: 'f', title: 123 as unknown as string},
        {name: 'f', title: undefined},
      ],
      ['description', {name: 'f', description: 'Hello'}, {name: 'f', description: 'Hello'}],
      [
        'description wrong type',
        {name: 'f', description: 123 as unknown as string},
        {name: 'f', description: undefined},
      ],
      ['group', {name: 'f', group: 'Hello'}, {name: 'f', group: 'Hello'}],
      [
        'group wrong type',
        {name: 'f', group: 123 as unknown as string},
        {name: 'f', group: undefined},
      ],
      ['hidden true', {name: 'f', hidden: true}, {name: 'f', hidden: true}],
      ['hidden false', {name: 'f', hidden: false}, {name: 'f', hidden: undefined}],
      ['readOnly true', {name: 'f', readOnly: true}, {name: 'f', readOnly: true}],
      ['readOnly false', {name: 'f', readOnly: false}, {name: 'f', readOnly: undefined}],
      [
        'options',
        {name: 'f', options: {collapsible: true}},
        {name: 'f', options: {collapsible: true}},
      ],
    ])('%s', (_, definition, expected) => {
      expect(
        convertType({
          name: 'person',
          type: 'object',
          fieldsets: [definition],
          fields: [{name: 'title', type: 'string'}],
        }).typeDef.fieldsets,
      ).toMatchObject([expected])
    })
  })

  describe('groups', () => {
    test.each<[string, FieldGroupDefinition, unknown]>([
      [
        'only name',
        {name: 'f'},
        {
          name: 'f',
          title: undefined,
          hidden: undefined,
        },
      ],
      ['title', {name: 'f', title: 'Hello'}, {name: 'f', title: 'Hello'}],
      [
        'title wrong type',
        {name: 'f', title: 123 as unknown as string},
        {name: 'f', title: undefined},
      ],
      ['hidden true', {name: 'f', hidden: true}, {name: 'f', hidden: true}],
      ['hidden false', {name: 'f', hidden: false}, {name: 'f', hidden: undefined}],
      ['hidden func', {name: 'f', hidden: () => false}, {name: 'f', hidden: {__type: 'function'}}],
      ['default true', {name: 'f', default: true}, {name: 'f', default: true}],
      ['default false', {name: 'f', default: false}, {name: 'f', default: undefined}],
    ])('%s', (_, definition, expected) => {
      expect(
        convertType({
          name: 'person',
          type: 'object',
          groups: [definition],
          fields: [{name: 'title', type: 'string'}],
        }).typeDef.groups,
      ).toMatchObject([expected])
    })

    test.todo('i18n')
  })

  test.todo('orderings')
})

describe('Array', () => {
  describe('of', () => {
    test('single string', () => {
      expect(
        convertType({name: 'foo', type: 'array', of: [{type: 'string'}]}).typeDef.of,
      ).toMatchObject([
        {
          name: 'string',
          typeDef: {extends: 'string'},
        },
      ])
    })

    test('same type with different name ', () => {
      expect(
        convertType(
          {
            name: 'foo',
            type: 'array',
            of: [
              {name: 'bar1', type: 'bar'},
              {name: 'bar2', type: 'bar'},
            ],
          },
          {name: 'bar', type: 'object', fields: [{name: 'title', type: 'string'}]},
        ).typeDef.of,
      ).toMatchObject([
        {
          name: 'bar1',
          typeDef: {extends: 'bar'},
        },
        {
          name: 'bar2',
          typeDef: {extends: 'bar'},
        },
      ])
    })
  })
})

describe('Text', () => {
  describe('rows', () => {
    test('undefined', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'text',
        }).typeDef,
      ).toMatchObject({
        rows: undefined,
      })
    })

    test('number', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'text',
          rows: 5,
        }).typeDef,
      ).toMatchObject({
        rows: '5',
      })
    })

    test('non-number', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'text',
          rows: '5' as unknown as number,
        }).typeDef,
      ).toMatchObject({
        rows: undefined,
      })
    })
  })
})

describe('References', () => {
  test('reference', () => {
    expect(
      convertType(
        {name: 'foo', type: 'reference', to: [{type: 'person'}]},
        {name: 'person', type: 'document', fields: [{name: 'name', type: 'string'}]},
      ).typeDef,
    ).toMatchObject({
      to: [{name: 'person'}],
      fields: [
        {name: '_ref', typeDef: {extends: 'string'}},
        {name: '_weak', typeDef: {extends: 'boolean'}},
      ],
    })
  })

  test('crossDatasetReference', () => {
    expect(
      convertType({
        name: 'foo',
        type: 'crossDatasetReference',
        dataset: 'other',
        to: [{type: 'person', preview: {select: {title: 'title'}}}],
      }).typeDef,
    ).toMatchObject({
      to: [{name: 'person'}],
      fields: [
        {name: '_ref', typeDef: {extends: 'string'}},
        {name: '_weak', typeDef: {extends: 'boolean'}},
        {name: '_dataset', typeDef: {extends: 'string'}},
        {name: '_projectId', typeDef: {extends: 'string'}},
      ],
    })
  })

  test('globalDocumentReference', () => {
    expect(
      convertType({
        name: 'foo',
        type: 'globalDocumentReference',
        resourceType: 'media-library',
        resourceId: 'foo',
        to: [{title: 'Person', type: 'person', preview: {select: {title: 'title'}}}],
      }).typeDef,
    ).toMatchObject({
      to: [{name: 'person'}],
      fields: [
        {name: '_ref', typeDef: {extends: 'string'}},
        {name: '_weak', typeDef: {extends: 'boolean'}},
      ],
    })
  })
})

describe('Block', () => {
  test('default settings', () => {
    const type = convertType({
      name: 'paragraph',
      type: 'block',
    })

    assert(type.typeDef.fields)
    const style = type.typeDef.fields.find(({name}) => name === 'style')
    assert(style)
    expect(style.typeDef.extends).toBe('string')
    expect(style.typeDef.options).toEqual({
      list: [
        {
          title: 'Normal',
          value: 'normal',
          i18nTitleKey: 'inputs.portable-text.style.normal',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h1',
          title: 'Heading 1',
          value: 'h1',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h2',
          title: 'Heading 2',
          value: 'h2',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h3',
          title: 'Heading 3',
          value: 'h3',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h4',
          title: 'Heading 4',
          value: 'h4',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h5',
          title: 'Heading 5',
          value: 'h5',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h6',
          title: 'Heading 6',
          value: 'h6',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.quote',
          title: 'Quote',
          value: 'blockquote',
        },
      ],
    })

    const listItem = type.typeDef.fields.find(({name}) => name === 'listItem')
    assert(listItem)
    expect(listItem.typeDef.extends).toBe('string')
    expect(listItem.typeDef.options).toEqual({
      list: [
        {
          i18nTitleKey: 'inputs.portable-text.list-type.bullet',
          title: 'Bulleted list',
          value: 'bullet',
        },
        {
          i18nTitleKey: 'inputs.portable-text.list-type.number',
          title: 'Numbered list',
          value: 'number',
        },
      ],
    })

    const markDefs = type.typeDef.fields.find(({name}) => name === 'markDefs')
    assert(markDefs)
    expect(markDefs.typeDef.extends).toBe('array')
    assert(markDefs.typeDef.of)
    expect((markDefs.typeDef.of as any[]).map(({name}) => name)).toEqual(['link'])

    const level = type.typeDef.fields.find(({name}) => name === 'level')
    assert(level)
    expect(level.typeDef.extends).toBe('number')
  })

  test('custom settings', () => {
    const type = convertType({
      name: 'paragraph',
      type: 'block',
      styles: [{title: 'Quote', value: 'blockquote'}],
      lists: [{title: 'Star', value: 'star'}],
      marks: {
        decorators: [{title: 'Weak', value: 'weak'}],
        annotations: [
          {name: 'internalLink', type: 'object', fields: [{name: 'path', type: 'string'}]},
        ],
      },
    })

    assert(type.typeDef.fields)
    const style = type.typeDef.fields.find(({name}) => name === 'style')
    assert(style)
    expect(style.typeDef.extends).toBe('string')
    expect(style.typeDef.options).toEqual({
      list: [
        {
          title: 'Normal',
          value: 'normal',
          i18nTitleKey: 'inputs.portable-text.style.normal',
        },
        {
          title: 'Quote',
          value: 'blockquote',
        },
      ],
    })

    const listItem = type.typeDef.fields.find(({name}) => name === 'listItem')
    assert(listItem)
    expect(listItem.typeDef.extends).toBe('string')
    expect(listItem.typeDef.options).toEqual({
      list: [
        {
          title: 'Star',
          value: 'star',
        },
      ],
    })

    const markDefs = type.typeDef.fields.find(({name}) => name === 'markDefs')
    assert(markDefs)
    expect(markDefs.typeDef.extends).toBe('array')
    assert(markDefs.typeDef.of)
    expect((markDefs.typeDef.of as any[]).map(({name}) => name)).toEqual(['internalLink'])

    const level = type.typeDef.fields.find(({name}) => name === 'level')
    assert(level)
    expect(level.typeDef.extends).toBe('number')
  })
})
