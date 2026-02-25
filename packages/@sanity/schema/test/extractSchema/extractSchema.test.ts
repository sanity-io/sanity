import assert, {strictEqual} from 'node:assert'

import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {type DocumentSchemaType} from 'groq-js'
import {describe, expect, test} from 'vitest'

import {Schema} from '../../src/legacy/Schema'
import {builtinTypes} from '../../src/sanity/builtinTypes'
import {extractSchema} from '../../src/sanity/extractSchema'
import {groupProblems} from '../../src/sanity/groupProblems'
import {validateSchema} from '../../src/sanity/validateSchema'
import schemaFixtures from '../legacy/fixtures/schemas'
import Block from './fixtures/block'

// taken from sanity/src/core/schema/createSchema.ts
function createSchema(schemaDef: {name: string; types: any[]}, skipBuiltins = false) {
  const validated = validateSchema(schemaDef.types).getTypes()
  const validation = groupProblems(validated)
  const hasErrors = validation.some((group) =>
    group.problems.some((problem) => problem.severity === 'error'),
  )

  return Schema.compile({
    name: 'test',
    types: hasErrors
      ? []
      : [...schemaDef.types, ...(skipBuiltins ? [] : builtinTypes)].filter(Boolean),
  })
}

describe('Extract schema test', () => {
  test('Extracts schema general', () => {
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: 'customUrlType',
          title: 'My custom url type',
          type: 'url',
        }),
        defineType({
          title: 'Valid document',
          name: 'validDocument',
          type: 'document',
          fields: [
            {
              title: 'Title',
              name: 'title',
              type: 'string',
            },
            {
              title: 'List',
              name: 'list',
              type: 'string',
              options: {
                list: ['a', 'b', 'c'],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              title: 'Number',
              name: 'number',
              type: 'number',
            },
            {
              title: 'some other object',
              name: 'someInlinedObject',
              type: 'obj',
            },
            {
              title: 'Manuscript',
              name: 'manuscript',
              type: 'manuscript',
            },
            {
              title: 'Some text',
              name: 'someTextType',
              type: 'someTextType',
            },
            {
              title: 'customStringType',
              name: 'customStringType',
              type: 'customStringType',
            },
            {
              title: 'customUrlType',
              name: 'customUrlType',
              type: 'customUrlType',
            },
            {
              title: 'Blocks',
              name: 'blocks',
              type: 'array',
              of: [{type: 'block'}],
            },
            {
              type: 'reference',
              name: 'other',
              to: {
                type: 'otherValidDocument',
              },
            },
            {
              type: 'reference',
              name: 'others',
              to: [
                {
                  type: 'otherValidDocument',
                },
              ],
            },
          ],
        }),
        {
          title: 'Author',
          name: 'author',
          type: 'document',
          fields: [
            {
              title: 'Name',
              name: 'name',
              type: 'string',
            },
            {
              title: 'Profile picture',
              name: 'profilePicture',
              type: 'image',
              options: {
                hotspot: true,
              },
              fields: [
                {
                  name: 'caption',
                  type: 'string',
                  title: 'Caption',
                },
                {
                  name: 'attribution',
                  type: 'string',
                  title: 'Attribution',
                },
              ],
            },
          ],
        },
        {
          title: 'Book',
          name: 'book',
          type: 'document',
          fields: [
            {
              title: 'Name',
              name: 'name',
              type: 'string',
            },
          ],
        },
        Block,
        {
          title: 'Other valid document',
          name: 'otherValidDocument',
          type: 'document',
          fields: [
            {
              title: 'Title',
              name: 'title',
              type: 'string',
            },
          ],
        },
        {
          type: 'object',
          name: 'obj',
          fields: [
            {
              title: 'Field #1',
              name: 'field1',
              type: 'string',
            },
            {
              title: 'Field #2',
              name: 'field2',
              type: 'number',
            },
          ],
        },
        defineType({
          name: 'customStringType',
          title: 'My custom string type',
          type: 'string',
        }),
        {
          type: 'object',
          name: 'code',
          fields: [
            {
              title: 'The Code!',
              name: 'thecode',
              type: 'string',
            },
          ],
        },
        {
          title: 'Manuscript',
          name: 'manuscript',
          type: 'file',
          fields: [
            {
              name: 'description',
              type: 'string',
              title: 'Description',
            },
            {
              name: 'author',
              type: 'reference',
              title: 'Author',
              to: {type: 'author'},
            },
          ],
        },
        defineType({
          name: 'someTextType',
          type: 'text',
        }),
      ],
    })

    const extracted = extractSchema(schema)

    expect(extracted.length).toBe(29)
    expect(extracted.map((v) => v.name)).toStrictEqual([
      'sanity.imageAsset.reference',
      'author.reference',
      'deep',
      'recursive',
      'sanity.imagePaletteSwatch',
      'sanity.imagePalette',
      'sanity.imageDimensions',
      'sanity.imageMetadata',
      'sanity.imageHotspot',
      'sanity.imageCrop',
      'geopoint',
      'slug',
      'sanity.assetSourceData',
      'someTextType',
      'sanity.fileAsset.reference',
      'manuscript',
      'sanity.fileAsset',
      'code',
      'customStringType',
      'obj',
      'book.reference',
      'blocksTest',
      'book',
      'author',
      'sanity.imageAsset',
      'otherValidDocument.reference',
      'validDocument',
      'otherValidDocument',
      'customUrlType',
    ])
    const validDocument = extracted.find((type) => type.name === 'validDocument')
    expect(validDocument).toBeDefined()
    assert(validDocument !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure

    expect(validDocument.name).toEqual('validDocument')
    expect(validDocument.type).toEqual('document')
    assert(validDocument.type === 'document') // this is a workaround for TS https://github.com/DefinitelyTyped/DefinitelyTyped/issues/41179
    expect(Object.keys(validDocument.attributes)).toStrictEqual([
      '_id',
      '_type',
      '_createdAt',
      '_updatedAt',
      '_rev',
      'title',
      'list',
      'number',
      'someInlinedObject',
      'manuscript',
      'someTextType',
      'customStringType',
      'customUrlType',
      'blocks',
      'other',
      'others',
    ])

    // Check that the block type is extracted correctly, as an array
    expect(validDocument.attributes.blocks.type).toEqual('objectAttribute')
    expect(validDocument.attributes.blocks.value.type).toEqual('array')
    assert(validDocument.attributes.blocks.value.type === 'array') // this is a workaround for TS
    expect(validDocument.attributes.blocks.value.of.type).toEqual('object')
    assert(validDocument.attributes.blocks.value.of.type === 'object') // this is a workaround for TS
    expect(Object.keys(validDocument.attributes.blocks.value.of.attributes)).toStrictEqual([
      'children',
      'style',
      'listItem',
      'markDefs',
      'level',
      '_type',
    ])

    expect(validDocument.attributes.blocks.value.of.attributes.children.value.type).toEqual('array')
    assert(validDocument.attributes.blocks.value.of.attributes.children.value.type === 'array') // this is a workaround for TS
    expect(validDocument.attributes.blocks.value.of.attributes.children.value.of.type).toEqual(
      'object',
    )
    assert(validDocument.attributes.blocks.value.of.attributes.children.value.of.type === 'object') // this is a workaround for TS
    expect(
      Object.keys(validDocument.attributes.blocks.value.of.attributes.children.value.of.attributes),
    ).toStrictEqual(['marks', 'text', '_type'])

    expect(extracted).toMatchSnapshot()
  })

  describe('Can hoist types', () => {
    test('Hoist repeated objects', () => {
      const schema = createSchema({
        name: 'test',
        types: [
          {
            title: 'Blocks Test',
            name: 'blocksTest',
            type: 'object',
            fields: [
              {
                title: 'Blocks',
                name: 'blocks',
                type: 'array',
                of: [{type: 'block'}],
              },
            ],
          },
          defineType({
            title: 'Document #1',
            name: 'documentOne',
            type: 'document',
            fields: [
              {
                title: 'Blocks',
                name: 'blocks',
                type: 'array',
                of: [{type: 'blocksTest'}],
              },
            ],
          }),
          defineType({
            title: 'Document #2',
            name: 'documentTwo',
            type: 'document',
            fields: [
              {
                title: 'Blocks',
                name: 'blocks',
                type: 'array',
                of: [{type: 'blocksTest'}],
              },
            ],
          }),
        ],
      })

      const extracted = extractSchema(schema)
      expect(extracted.map((v) => v.name)).toStrictEqual([
        'sanity.imagePaletteSwatch',
        'sanity.imagePalette',
        'sanity.imageDimensions',
        'sanity.imageMetadata',
        'sanity.imageHotspot',
        'sanity.imageCrop',
        'sanity.fileAsset',
        'sanity.assetSourceData',
        'sanity.imageAsset',
        'geopoint',
        'slug',
        'documentTwo',
        'documentOne',
        'blocksTest',
      ])

      // Check that the repeated type was hoisted
      const hoistedType = extracted.find((type) => type.name === 'blocksTest')
      expect(hoistedType).toBeDefined()
      assert(hoistedType !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure

      expect(hoistedType.name).toEqual('blocksTest')
      assert(hoistedType.type === 'type') // this is a workaround for TS https://github.com/DefinitelyTyped/DefinitelyTyped/issues/41179
      assert(hoistedType.value.type === 'object') // this is a workaround for TS
      expect(Object.keys(hoistedType.value.attributes)).toStrictEqual(['_type', 'blocks'])
      assert(hoistedType.value.attributes.blocks.value.type === 'array')
      assert(hoistedType.value.attributes.blocks.value.of.type === 'object')

      // Check that the document correctly references the hoisted type
      const validDocument = extracted.find((type) => type.name === 'documentOne')
      expect(validDocument).toBeDefined()
      assert(validDocument !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
      expect(validDocument.name).toEqual('documentOne')
      expect(validDocument.type).toEqual('document')
      assert(validDocument.type === 'document') // this is a workaround for TS
      expect(Object.keys(validDocument.attributes)).toStrictEqual([
        '_id',
        '_type',
        '_createdAt',
        '_updatedAt',
        '_rev',
        'blocks',
      ])

      // Check that the block type is extracted correctly, as an array
      expect(validDocument.attributes.blocks.type).toEqual('objectAttribute')
      expect(validDocument.attributes.blocks.value.type).toEqual('array')
      assert(validDocument.attributes.blocks.value.type === 'array') // this is a workaround for TS
      expect(validDocument.attributes.blocks.value.of.type).toEqual('object')
      assert(validDocument.attributes.blocks.value.of.type === 'object') // this is a workaround for TS
      expect(Object.keys(validDocument.attributes.blocks.value.of.attributes)).toStrictEqual([
        '_key',
      ])
      assert(validDocument.attributes.blocks.value.of.rest?.type === 'inline') // this is a workaround for TS
      expect(validDocument.attributes.blocks.value.of.rest.name).toBe(hoistedType.name)

      expect(extracted).toMatchSnapshot()
    })

    test('inline reference types should not conflict with the ones defined by the user', () => {
      const schema = createSchema(
        {
          name: 'test',
          types: [
            defineType({
              title: 'Blog post',
              name: 'blog',
              type: 'document',
              fields: [
                {
                  type: 'blog.reference',
                  name: 'relevant',
                },
              ],
            }),
            defineType({
              name: 'blog.reference',
              type: 'object',
              fields: [
                {name: 'title', type: 'string'},
                {name: 'blogPost', type: 'reference', to: [{type: 'blog'}]},
              ],
            }),
          ],
        },
        true,
      )

      const extracted = extractSchema(schema)

      expect(extracted.map((v) => v.name)).toStrictEqual([
        'blog.reference1', // the doc ref type
        'blog.reference', // the user defined object type
        'blog',
      ])

      expect(extracted).toMatchSnapshot()
      const userDefinedObjType = extracted.find((type) => type.name === 'blog.reference')
      expect(userDefinedObjType).toBeDefined()
      assert(userDefinedObjType !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
      expect(userDefinedObjType.type).toBe('type')
      assert(userDefinedObjType.type === 'type')
      expect(userDefinedObjType.value.type).toBe('object')
    })

    test('hoisted inline types should not conflict with user defined schema types', () => {
      const myAwesomeTypeObject = defineField({
        name: 'myAwesomeType',
        type: 'object',
        fields: [{type: 'string', name: 'title'}],
      })

      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: 'myAwesomeType',
            type: 'string',
          }),
          defineType({
            title: 'Document #1',
            name: 'documentOne',
            type: 'document',
            fields: [
              myAwesomeTypeObject,
              {
                type: 'array',
                name: 'blocks',
                of: [{type: 'block'}],
              },
            ],
          }),
          defineType({
            title: 'Document #2',
            name: 'documentTwo',
            type: 'document',
            fields: [
              myAwesomeTypeObject,
              {
                type: 'array',
                name: 'blocks',
                of: [{type: 'block'}],
              },
            ],
          }),
        ],
      })

      const extracted = extractSchema(schema)
      expect(extracted.map((v) => v.name)).toStrictEqual([
        'myAwesomeType1',
        'sanity.imagePaletteSwatch',
        'sanity.imagePalette',
        'sanity.imageDimensions',
        'sanity.imageMetadata',
        'sanity.imageHotspot',
        'sanity.imageCrop',
        'sanity.fileAsset',
        'sanity.assetSourceData',
        'sanity.imageAsset',
        'geopoint',
        'slug',
        'documentTwo',
        'documentOne',
        'myAwesomeType',
      ])

      // Check that the user defined typed has the expected name
      const userDefinedType = extracted.find((type) => type.name === 'myAwesomeType')
      expect(userDefinedType).toBeDefined()
      expect(userDefinedType).toEqual({
        name: 'myAwesomeType',
        type: 'type',
        value: {
          type: 'string',
        },
      })

      // Check that the repeated type was hoisted
      const hoistedType = extracted.find((type) => type.name === 'myAwesomeType1')
      expect(hoistedType).toBeDefined()
      assert(hoistedType !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
      expect(hoistedType.name).toEqual('myAwesomeType1')
      assert(hoistedType.type === 'type') // this is a workaround for TS https://github.com/DefinitelyTyped/DefinitelyTyped/issues/41179
      assert(hoistedType.value.type === 'object') // this is a workaround for TS
      expect(Object.keys(hoistedType.value.attributes)).toStrictEqual(['title'])

      expect(extracted).toMatchSnapshot()
    })
  })

  test('order of types does not matter', () => {
    const schema1 = createSchema({
      name: 'test',
      types: [
        {
          title: 'Author',
          name: 'author',
          type: 'object',
          fields: [
            {
              title: 'Name',
              name: 'name',
              type: 'string',
            },
          ],
        },
        {
          title: 'Book',
          name: 'book',
          type: 'document',
          fields: [
            {
              title: 'Name',
              name: 'name',
              type: 'string',
            },
            {
              title: 'Author',
              name: 'author',
              type: 'author',
            },
          ],
        },
      ],
    })

    expect(extractSchema(schema1).map((v) => v.name)).toStrictEqual([
      'sanity.imagePaletteSwatch',
      'sanity.imagePalette',
      'sanity.imageDimensions',
      'sanity.imageMetadata',
      'sanity.imageHotspot',
      'sanity.imageCrop',
      'sanity.fileAsset',
      'sanity.assetSourceData',
      'sanity.imageAsset',
      'geopoint',
      'slug',
      'book',
      'author',
    ])
  })

  test('all fields are marked as optional without "enforceRequiredFields"', () => {
    const schema1 = createSchema({
      name: 'test',
      types: [
        {
          title: 'Book',
          name: 'book',
          type: 'document',
          fields: [
            {
              title: 'Title',
              name: 'title',
              type: 'string',
            },
            defineField({
              title: 'Subtitle',
              name: 'subtitle',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            {
              title: 'Another Title',
              name: 'anotherTitle',
              type: 'string',
              validation: {_required: 'required'},
            },
          ],
        },
      ],
    })

    const extracted = extractSchema(schema1, {enforceRequiredFields: false})

    const book = extracted.find((type) => type.name === 'book')
    expect(book).toBeDefined()
    assert(book !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
    assert(book.type === 'document') // this is a workaround for TS, but leave the expect above for clarity in case of failure
    expect(book.attributes.title.optional).toBe(true)
    expect(book.attributes.subtitle.optional).toBe(true)
    expect(book.attributes.anotherTitle.optional).toBe(true)
  })

  test('can extract with enforceRequiredFields', () => {
    const schema1 = createSchema({
      name: 'test',
      types: [
        {
          title: 'Book',
          name: 'book',
          type: 'document',
          fields: [
            {
              title: 'Title',
              name: 'title',
              type: 'string',
            },
            defineField({
              title: 'Subtitle',
              name: 'subtitle',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            {
              title: 'Image',
              name: 'image',
              type: 'image',
            },
            {
              title: 'Another Title',
              name: 'anotherTitle',
              type: 'string',
              validation: {_required: 'required'},
            },
            {
              title: 'Optional Title',
              name: 'optionalTitle',
              type: 'string',
              validation: {_required: 'optional'},
            },
          ],
        },
      ],
    })

    const extracted = extractSchema(schema1, {enforceRequiredFields: true})

    const book = extracted.find((type) => type.name === 'book')
    expect(book).toBeDefined()
    assert(book !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
    assert(book.type === 'document') // this is a workaround for TS, but leave the expect above for clarity in case of failure
    expect(book.attributes.title.optional).toBe(true)
    expect(book.attributes.subtitle.optional).toBe(false)
    expect(book.attributes.anotherTitle.optional).toBe(false)
    expect(book.attributes.optionalTitle.optional).toBe(true)
    expect(book.attributes.image.optional).toBe(true)
    assert(book.attributes.image.value.type === 'object') // this is a workaround for TS, but leave the expect above for clarity in case of failure

    const hotspot = extracted.find((type) => type.name === 'sanity.imageHotspot')
    assert(hotspot !== undefined)
    assert(hotspot.type === 'type')
    assert(hotspot.value.type === 'object')
    expect(hotspot.value.attributes.x.optional).toBe(false)
    expect(hotspot.value.attributes.y.optional).toBe(false)
  })

  test('enforceRequiredFields handles `assetRequired`', () => {
    const schema1 = createSchema({
      name: 'test',
      types: [
        {
          title: 'Book',
          name: 'book',
          type: 'document',
          fields: [
            {
              title: 'Title',
              name: 'title',
              type: 'string',
            },
            defineField({
              title: 'Required Image',
              name: 'requiredImage',
              type: 'image',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              title: 'Asset Required Image',
              name: 'assetRequiredImage',
              type: 'image',
              validation: (Rule) => Rule.required().assetRequired(),
            }),
            defineField({
              name: 'logos',
              title: 'Logos',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'image',
                  name: 'definedImageInArray',
                  title: 'Image',
                  validation: (rule) => [rule.required().assetRequired()],
                }),
              ],
              validation: (rule) => [rule.required()],
            }),
            {
              title: 'Asset Required File Rule Spec',
              name: 'assetRequiredFileRuleSpec',
              type: 'file',
              validation: {
                _required: 'required',
                _rules: [{flag: 'assetRequired', constraint: {assetType: 'file'}}],
              },
            },
          ],
        },
      ],
    })

    const extracted = extractSchema(schema1, {enforceRequiredFields: true})
    const book = extracted.find((type) => type.name === 'book')
    expect(book).toBeDefined()
    assert(book !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
    assert(book.type === 'document') // this is a workaround for TS, but leave the expect above for clarity in case of failure
    expect(book.attributes.title.optional).toBe(true)

    expect(book.attributes.requiredImage.optional).toBe(false)
    assert(book.attributes.requiredImage.value.type === 'object') // this is a workaround for TS, but leave the expect above for clarity in case of failure
    expect(book.attributes.requiredImage.value.attributes.asset.optional).toBe(true) // we dont set assetRequired(), so it should be optional

    expect(book.attributes.assetRequiredImage.optional).toBe(false)
    assert(book.attributes.assetRequiredImage.value.type === 'object') // this is a workaround for TS, but leave the expect above for clarity in case of failure
    expect(book.attributes.assetRequiredImage.value.attributes.asset.optional).toBe(false) // with assetRequired(), it should be required

    expect(book.attributes.assetRequiredFileRuleSpec.optional).toBe(false)
    assert(book.attributes.assetRequiredFileRuleSpec.value.type === 'object') // this is a workaround for TS, but leave the expect above for clarity in case of failure
    expect(book.attributes.assetRequiredFileRuleSpec.value.attributes.asset.optional).toBe(false) // with assetRequired defined in _rules, it should be required

    expect(book.attributes.logos.optional).toBe(false)
    assert(book.attributes.logos.value.type === 'array') // this is a workaround for TS, but leave the expect above for clarity in case of failure
    assert(book.attributes.logos.value.of.type === 'object') // this is a workaround for TS, but leave the expect above for clarity in case of failure
    expect(book.attributes.logos.value.of.attributes.asset.optional).toBe(false) // with assetRequired defined, it should be required

    expect(book).toMatchSnapshot()
  })

  test('can handle `list` option that is not an array', () => {
    const schema = createSchema(schemaFixtures.listObjectOption)
    const extracted = extractSchema(schema)

    const post = extracted.find((type) => type.name === 'post')
    assert(post !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
    assert(post.type === 'document') // this is a workaround for TS, but leave the expect above for clarity in case of failure

    strictEqual(post.attributes.align.value.type, 'inline')
    strictEqual(post.attributes.align.value.name, 'stringWithListOption')

    const stringWithListOption = extracted.find((type) => type.name === 'stringWithListOption')
    assert(stringWithListOption !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
    strictEqual(stringWithListOption.type, 'type')
    strictEqual(stringWithListOption.value.type, 'string')
  })

  describe('Can extract sample fixtures', () => {
    const cases = Object.keys(schemaFixtures).map((schemaName) => {
      const schema = createSchema((schemaFixtures as any)[schemaName])
      if (schema._original.types.length === 0) {
        return {schemaName, schema: null}
      }
      return {schemaName, schema}
    })
    const passes = cases.filter((v): v is {schemaName: string; schema: Schema} => v.schema !== null)

    test.each(passes)('extracts schema $schemaName', ({schema}) => {
      const extracted = extractSchema(schema)
      expect(extracted.length).toBeGreaterThan(0) // we don't really care about the exact number, just that it passes :+1:
    })

    const skips = cases.filter((v): v is {schemaName: string; schema: null} => v.schema === null)
    test.skip.each(skips)('extracts schema $schemaName', () => {
      // Add a test for the skipped cases so we can track them in the test report
    })
  })

  test('Can extract inline documents', () => {
    const schema = createSchema(
      {
        name: 'test',
        types: [
          defineType({
            title: 'Valid document',
            name: 'validDocument',
            type: 'document',
            fields: [
              {
                title: 'inline author',
                name: 'inlineAuthor',
                type: 'author',
              },
              {
                title: 'inline author',
                name: 'inlineAuthors',
                type: 'array',
                of: [{type: 'author'}],
              },
              {
                title: 'reference author',
                name: 'referenceAuthor',
                type: 'reference',
                to: [{type: 'author'}],
              },
              {
                title: 'references author',
                name: 'referenceAuthors',
                type: 'array',
                of: [{type: 'reference', to: [{type: 'author'}]}],
              },
            ],
          }),
          {
            title: 'Author',
            name: 'author',
            type: 'document',
            fields: [
              {
                title: 'Name',
                name: 'name',
                type: 'string',
              },
            ],
          },
        ],
      },
      true,
    )

    const extracted = extractSchema(schema)
    expect(extracted.map((v) => v.name)).toStrictEqual([
      'author.reference',
      'validDocument',
      'author',
    ])
    const validDocument = extracted.find((type) => type.name === 'validDocument')
    expect(validDocument).toBeDefined()
    assert(validDocument !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure

    const authorDocument = extracted.find(
      (type): type is DocumentSchemaType => type.name === 'author' && type.type === 'document',
    )
    expect(authorDocument).toBeDefined()
    assert(authorDocument !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure

    expect(validDocument.name).toEqual('validDocument')
    expect(validDocument.type).toEqual('document')
    assert(validDocument.type === 'document') // this is a workaround for TS https://github.com/DefinitelyTyped/DefinitelyTyped/issues/41179
    expect(Object.keys(validDocument.attributes)).toStrictEqual([
      '_id',
      '_type',
      '_createdAt',
      '_updatedAt',
      '_rev',
      'inlineAuthor',
      'inlineAuthors',
      'referenceAuthor',
      'referenceAuthors',
    ])

    strictEqual(validDocument.attributes.inlineAuthor.value.type, 'object')
    strictEqual(validDocument.attributes.inlineAuthors.value.type, 'array')
    strictEqual(validDocument.attributes.inlineAuthors.value.of.type, 'object')
    expect(validDocument.attributes.inlineAuthors.value.of.attributes).toEqual({
      _type: {type: 'objectAttribute', value: {type: 'string', value: 'author'}},
      name: {optional: true, type: 'objectAttribute', value: {type: 'string'}},
    })
    strictEqual(validDocument.attributes.inlineAuthors.value.of.rest?.type, 'object')

    expect(extracted).toMatchSnapshot()
  })

  test('will ignore global document reference types at the moment', () => {
    const schema = createSchema(
      {
        name: 'test',
        types: [
          defineType({
            title: 'Valid document',
            name: 'validDocument',
            type: 'document',
            fields: [
              {
                type: 'globalDocumentSubtype',
                name: 'author',
              },
              {
                type: 'book',
                name: 'book',
              },
            ],
          }),
          {
            type: 'globalDocumentReference',
            name: 'globalDocumentSubtype',
            title: 'Subtype of global document references',
            resourceType: 'dataset',
            resourceId: 'exx11uqh.blog',
            to: [
              {
                type: 'book',
                preview: {
                  select: {
                    title: 'title',
                    media: 'coverImage',
                  },
                  prepare(val: any) {
                    return {
                      title: val.title,
                      media: val.coverImage,
                    }
                  },
                },
              },
            ],
          },
          {
            type: 'object',
            title: 'Book',
            name: 'book',
            fields: [
              {
                type: 'string',
                name: 'title',
              },
            ],
          },
        ],
      },
      true,
    )

    const extracted = extractSchema(schema)
    expect(extracted.map((v) => v.name)).toStrictEqual(['book', 'validDocument'])
    const validDocument = extracted.find((type) => type.name === 'validDocument')
    expect(validDocument).toBeDefined()
    assert(validDocument !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
    expect(extracted).toMatchSnapshot()
  })

  test('inline reference types works', () => {
    const schema = createSchema(
      {
        name: 'test',
        types: [
          defineType({
            title: 'Valid document',
            name: 'validDocument',
            type: 'document',
            fields: [
              {
                type: 'inlineRef',
                name: 'link',
              },
            ],
          }),
          defineType({
            type: 'reference',
            title: 'InlineRef',
            name: 'inlineRef',
            to: [{type: 'thing'}],
          }),
          defineType({
            type: 'object',
            title: 'thing',
            name: 'thing',
            fields: [
              {
                type: 'string',
                name: 'title',
              },
            ],
          }),
        ],
      },
      true,
    )

    const extracted = extractSchema(schema)
    expect(extracted.map((v) => v.name)).toStrictEqual([
      'thing.reference',
      'inlineRef',
      'validDocument',
      'thing',
    ])
    expect(extracted).toMatchSnapshot()
    const inlineRef = extracted.find((type) => type.name === 'inlineRef')
    expect(inlineRef).toBeDefined()
    assert(inlineRef !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
    expect(inlineRef.type).toBe('type')
    assert(inlineRef.type === 'type')
    expect(inlineRef.value.type).toBe('inline')
    assert(inlineRef.value.type === 'inline')
    expect(inlineRef.value.name).toBe('thing.reference')
  })
})

test('field with a type defined as a document type is not hoisted', () => {
  const schema = createSchema(
    {
      name: 'test',
      types: [
        defineType({
          name: 'hero',
          type: 'object',
          fields: [{type: 'string', name: 'title'}],
        }),
        defineType({
          name: 'author',
          type: 'document',
          fields: [{type: 'string', name: 'title'}],
        }),
        defineType({
          name: 'post',
          type: 'document',
          fields: [
            {type: 'string', name: 'title'},
            {type: 'author', name: 'author'},
            {type: 'hero', name: 'hero'},
            {type: 'reference', name: 'authorRef', to: [{type: 'author'}]},
          ],
        }),
      ],
    },
    true,
  )

  const extracted = extractSchema(schema)
  const postType = extracted.find((t) => t.name === 'post')

  assert(postType?.type === 'document')

  // we expect the hero to be an inline ref
  expect(postType.attributes.hero.value).toEqual({
    name: 'hero',
    type: 'inline',
  })

  // we expect the field referencing a doc type not to be an inline ref
  expect(postType.attributes.author.value.type).toBe('object')
  assert(postType.attributes.author.value.type === 'object')
  expect(postType.attributes.author.value.attributes._type.value).toEqual({
    type: 'string',
    value: 'author',
  })

  // we do expect the reference to be an inline ref to the hoisted ref type
  expect(postType.attributes.authorRef.value.type).toBe('inline')

  expect(extracted).toMatchSnapshot()
})

test('inline regression: inline type that references other inline type', () => {
  const schema = createSchema(
    {
      name: 'test',
      types: [
        defineType({
          type: 'iconPicker',
          title: 'sanityIcon',
          name: 'sanityIcon',
        }),
        defineType({
          type: 'object',
          title: 'iconPicker',
          name: 'iconPicker',
          fields: [
            {
              type: 'string',
              name: 'title',
            },
          ],
        }),
      ],
    },
    true,
  )

  const extracted = extractSchema(schema)
  expect(extracted.map((v) => v.name)).toStrictEqual(['sanityIcon', 'iconPicker'])
  expect(extracted).toMatchSnapshot()
  const inlineRef = extracted.find((type) => type.name === 'sanityIcon')
  expect(inlineRef).toBeDefined()
  assert(inlineRef !== undefined) // this is a workaround for TS, but leave the expect above for clarity in case of failure
  assert(inlineRef.type === 'type')
  assert(inlineRef.value.type === 'inline')
  expect(inlineRef.value.name).toBe('iconPicker')
})

test('reference regression: references pointing to hoisted type', () => {
  const author1Object = defineField({
    name: 'author1',
    type: 'object',
    fields: [
      {
        name: 'name',
        type: 'string',
      },
    ],
  })
  const authorObject = defineField({
    name: 'author',
    type: 'object',
    fields: [
      {
        name: 'name',
        type: 'string',
      },
      author1Object,
    ],
  })

  const schema = createSchema(
    {
      name: 'test',
      types: [
        author1Object,
        defineType({
          name: 'post.something.author',
          type: 'document',
          fields: [
            {type: 'string', name: 'title'},
            authorObject,
            author1Object,
            {type: 'array', name: 'listOfAuthors', of: [authorObject]},
          ],
        }),
        defineType({
          name: 'something.author',
          type: 'document',
          fields: [{type: 'string', name: 'title'}, authorObject],
        }),
        defineType({
          name: 'author',
          type: 'document',
          fields: [authorObject],
        }),
        defineType({
          name: 'post',
          type: 'document',
          fields: [
            {name: 'something', type: 'object', fields: [authorObject]},
            {name: 'authorRef', type: 'reference', to: [{type: 'author'}]},
            authorObject,
          ],
        }),
      ],
    },
    true,
  )

  const extracted = extractSchema(schema)

  expect(extracted).toMatchSnapshot()

  expect(extracted.find((v) => v.name === 'author1')).toEqual({
    name: 'author1',
    type: 'type',
    value: {
      type: 'object',
      attributes: {
        _type: {
          type: 'objectAttribute',
          value: {
            type: 'string',
            value: 'author1',
          },
        },
        name: expect.anything(),
      },
    },
  })
  expect(extracted.find((v) => v.name === 'author2')).toEqual({
    name: 'author2',
    type: 'type',
    value: {
      type: 'object',
      attributes: {
        name: expect.anything(),
        author1: {
          optional: true,
          type: 'objectAttribute',
          value: {
            type: 'inline',
            name: 'author11',
          },
        },
      },
    },
  })
  expect(extracted.map((v) => v.name)).toStrictEqual([
    'author11',
    'author2',
    'author.reference',
    'post',
    'author',
    'something.author',
    'post.something.author',
    'author1',
  ])
  const postType = extracted.find((v) => v.name === 'post')
  expect(postType).toBeDefined()
  assert(postType?.type === 'document') // this is a workaround for TS, but leave the expect above for clarity in case of failure
  expect(postType.attributes.authorRef.value.type).toEqual('inline')
  assert(postType.attributes.authorRef.value.type === 'inline') // this is a workaround for TS
  expect(postType.attributes.authorRef.value.name).toEqual('author.reference')
})
