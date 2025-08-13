/* eslint-disable camelcase */
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {
  extractCreateWorkspaceManifest,
  extractManifestSchemaTypes,
} from '../../src/_internal/manifest/extractWorkspaceManifest'
import {createSchema} from '../../src/core/schema/createSchema'
import {createWorkspaceFromConfig} from '../../src/core'

describe('Extract studio manifest', () => {
  describe('extract workspace config', () => {
    test('should extract workspace config', async () => {
      const projectId = 'ppsg7ml5'
      const dataset = 'production'

      const workspaceConfig = await createWorkspaceFromConfig({
        projectId,
        dataset,
        name: 'default',
        mediaLibrary: {
          enabled: true,
          libraryId: undefined,
        },
      })

      const extracted = extractCreateWorkspaceManifest(workspaceConfig)
      expect(extracted).toMatchObject({
        name: 'default',
        projectId,
        dataset,
        mediaLibrary: {enabled: true, libraryId: undefined},
      })
    })
  })
  describe('serialize schema for manifest', () => {
    test('extracted schema should only include user defined types (and no built-in types)', () => {
      const documentType = 'basic'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: documentType,
            type: 'document',
            fields: [defineField({name: 'title', type: 'string'})],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      expect(extracted.map((v) => v.name)).toStrictEqual([documentType])
    })

    test('indicate conditional for function values on hidden and readOnly fields', () => {
      const documentType = 'basic'

      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: documentType,
            type: 'document',
            readOnly: true,
            hidden: false,
            fields: [
              defineField({
                name: 'string',
                type: 'string',
                hidden: () => true,
                readOnly: () => false,
              }),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        type: 'document',
        name: 'basic',
        readOnly: true,
        hidden: false,
        fields: [
          {
            name: 'string',
            type: 'string',
            hidden: 'conditional',
            readOnly: 'conditional',
          },
        ],
      })
    })

    test('should omit known non-serializable schema props ', () => {
      const documentType = 'remove-props'

      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            //include
            name: documentType,
            type: 'document',
            title: 'My document',
            description: 'Stuff',
            deprecated: {
              reason: 'old',
            },
            options: {
              // @ts-expect-error - this is a test
              custom: 'value',
            },
            initialValue: {title: 'Default'},
            liveEdit: true,

            //omit
            icon: () => 'remove-icon',
            groups: [{name: 'groups-are-removed'}],
            __experimental_omnisearch_visibility: true,
            __experimental_search: [
              {
                path: 'title',
                weight: 100,
              },
            ],
            __experimental_formPreviewTitle: true,
            components: {
              field: () => 'remove-components',
            },
            orderings: [
              {name: 'remove-orderings', title: '', by: [{field: 'title', direction: 'desc'}]},
            ],
            fields: [
              defineField({
                name: 'string',
                type: 'string',
                group: 'groups-are-removed',
              }),
            ],
            preview: {
              select: {title: 'remove-preview'},
            },
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        type: 'document',
        name: documentType,
        title: 'My document',
        description: 'Stuff',
        deprecated: {
          reason: 'old',
        },
        options: {
          custom: 'value',
        },
        initialValue: {title: 'Default'},
        liveEdit: true,
        fields: [
          {
            name: 'string',
            type: 'string',
          },
        ],
      })
    })

    test('schema should include most userland properties', () => {
      const documentType = 'basic'

      // oxlint-disable-next-line no-explicit-any
      const recursiveObject: any = {
        repeat: 'string',
      }
      recursiveObject.recurse = recursiveObject
      // oxlint-disable-next-line no-explicit-any
      const customization: any = {
        recursiveObject, // this one will be cut off at max-depth
        serializableProp: 'dummy',
        nonSerializableProp: () => {},
        options: {
          serializableOption: true,
          nonSerializableOption: () => {},
          nested: {
            serializableOption: 1,
            nonSerializableOption: () => {},
          },
        },
      }

      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: documentType,
            type: 'document',
            fields: [
              defineField({
                title: 'Nested',
                name: 'nested',
                type: 'object',
                fields: [
                  defineField({
                    title: 'Nested inline string',
                    name: 'nestedString',
                    type: 'string',
                    ...customization,
                  }),
                ],
                ...customization,
              }),
            ],
            ...customization,
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)

      const expectedCustomProps = {
        serializableProp: 'dummy',
        options: {
          serializableOption: true,
          nested: {
            serializableOption: 1,
          },
        },
        recursiveObject: {
          recurse: {
            recurse: {
              recurse: {
                repeat: 'string',
              },
              repeat: 'string',
            },
            repeat: 'string',
          },
          repeat: 'string',
        },
      }

      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        type: 'document',
        name: 'basic',
        fields: [
          {
            name: 'nested',
            type: 'object',
            fields: [
              {
                name: 'nestedString',
                title: 'Nested inline string',
                type: 'string',
                ...expectedCustomProps,
              },
            ],
            ...expectedCustomProps,
          },
        ],
        ...expectedCustomProps,
      })
    })

    test('should serialize fieldset config', () => {
      const documentType = 'fieldsets'

      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: documentType,
            type: 'document',
            fields: [
              defineField({
                name: 'string',
                type: 'string',
              }),
            ],
            preview: {
              select: {title: 'title'},
              prepare: () => ({
                title: 'remove-prepare',
              }),
            },
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        type: 'document',
        name: documentType,
        fields: [
          {
            name: 'string',
            type: 'string',
          },
        ],
      })
    })

    test('serialize fieldless types', () => {
      const documentType = 'fieldless-types'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            title: 'Some document',
            name: documentType,
            type: 'document',
            fields: [
              defineField({title: 'String field', name: 'string', type: 'string'}),
              defineField({title: 'Text field', name: 'text', type: 'text'}),
              defineField({title: 'Number field', name: 'number', type: 'number'}),
              defineField({title: 'Boolean field', name: 'boolean', type: 'boolean'}),
              defineField({title: 'Date field', name: 'date', type: 'date'}),
              defineField({title: 'Datetime field', name: 'datetime', type: 'datetime'}),
              defineField({title: 'Geopoint field', name: 'geopoint', type: 'geopoint'}),
              defineField({title: 'Basic image field', name: 'image', type: 'image'}),
              defineField({title: 'Basic file field', name: 'file', type: 'file'}),
              defineField({title: 'Slug field', name: 'slug', type: 'slug'}),
              defineField({title: 'URL field', name: 'url', type: 'url'}),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)

      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        fields: [
          {name: 'string', title: 'String field', type: 'string'},
          {name: 'text', title: 'Text field', type: 'text'},
          {name: 'number', title: 'Number field', type: 'number'},
          {name: 'boolean', title: 'Boolean field', type: 'boolean'},
          {name: 'date', title: 'Date field', type: 'date'},
          {name: 'datetime', title: 'Datetime field', type: 'datetime'},
          {name: 'geopoint', title: 'Geopoint field', type: 'geopoint'},
          {name: 'image', title: 'Basic image field', type: 'image'},
          {name: 'file', title: 'Basic file field', type: 'file'},
          {
            name: 'slug',
            title: 'Slug field',
            type: 'slug',
            validation: [{level: 'error', rules: [{flag: 'custom'}]}],
          },
          {
            name: 'url',
            title: 'URL field',
            type: 'url',
            validation: [
              {
                level: 'error',
                rules: [
                  {
                    constraint: {
                      options: {
                        allowCredentials: false,
                        allowRelative: false,
                        relativeOnly: false,
                        scheme: ['/^http$/', '/^https$/'],
                      },
                    },
                    flag: 'uri',
                  },
                ],
              },
            ],
          },
        ],
        name: documentType,
        title: 'Some document',
        type: 'document',
      })
    })

    test('serialize types with fields', () => {
      const documentType = 'field-types'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            fields: [
              {
                name: 'existingType',
                type: documentType,
              },
              {
                fields: [
                  {
                    name: 'nestedString',
                    title: 'Nested inline string',
                    type: 'string',
                  },
                  {
                    fields: [
                      {
                        name: 'inner',
                        title: 'Inner',
                        type: 'number',
                      },
                    ],
                    name: 'nestedTwice',
                    title: 'Child object',
                    type: 'object',
                  },
                ],
                name: 'nested',
                title: 'Nested',
                type: 'object',
              },
              {
                fields: [
                  {
                    name: 'title',
                    title: 'Image title',
                    type: 'string',
                  },
                ],
                name: 'image',
                type: 'image',
              },
              {
                fields: [
                  {
                    name: 'title',
                    title: 'File title',
                    type: 'string',
                  },
                ],
                name: 'file',
                type: 'file',
              },
            ],
            name: documentType,
            type: 'document',
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)

      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        fields: [
          {
            name: 'existingType',
            type: 'field-types',
          },

          {
            fields: [
              {
                name: 'nestedString',
                title: 'Nested inline string',
                type: 'string',
              },
              {
                fields: [
                  {
                    name: 'inner',
                    type: 'number',
                  },
                ],
                name: 'nestedTwice',
                title: 'Child object',
                type: 'object',
              },
            ],
            name: 'nested',
            type: 'object',
          },
          {
            fields: [
              {
                name: 'title',
                title: 'Image title',
                type: 'string',
              },
            ],
            name: 'image',
            type: 'image',
          },
          {
            fields: [
              {
                name: 'title',
                title: 'File title',
                type: 'string',
              },
            ],
            name: 'file',
            type: 'file',
          },
        ],
        name: documentType,
        type: 'document',
      })
    })

    test('serialize array-like fields (portable text tested separately)', () => {
      const documentType = 'all-types'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            title: 'Basic doc',
            name: documentType,
            type: 'document',
            fields: [
              defineField({
                title: 'String array',
                name: 'stringArray',
                type: 'array',
                of: [{type: 'string'}],
              }),
              defineField({
                title: 'Number array',
                name: 'numberArray',
                type: 'array',
                of: [{type: 'number'}],
              }),
              defineField({
                title: 'Boolean array',
                name: 'booleanArray',
                type: 'array',
                of: [{type: 'boolean'}],
              }),
              defineField({
                name: 'objectArray',
                type: 'array',
                of: [
                  defineArrayMember({
                    title: 'Anonymous object item',
                    type: 'object',
                    fields: [
                      defineField({
                        name: 'itemTitle',
                        type: 'string',
                      }),
                    ],
                  }),
                  defineArrayMember({
                    type: 'object',
                    title: 'Inline named object item',
                    name: 'item',
                    fields: [
                      defineField({
                        name: 'otherTitle',
                        type: 'string',
                      }),
                    ],
                  }),
                  defineArrayMember({
                    title: 'Existing type object item',
                    type: documentType,
                  }),
                ],
              }),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)

      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        fields: [
          {
            name: 'stringArray',
            of: [{type: 'string'}],
            title: 'String array',
            type: 'array',
          },
          {
            name: 'numberArray',
            of: [{type: 'number'}],
            title: 'Number array',
            type: 'array',
          },
          {
            name: 'booleanArray',
            of: [{type: 'boolean'}],
            title: 'Boolean array',
            type: 'array',
          },
          {
            name: 'objectArray',
            of: [
              {
                title: 'Anonymous object item',
                type: 'object',
                fields: [{name: 'itemTitle', type: 'string'}],
              },
              {
                fields: [{name: 'otherTitle', type: 'string'}],
                title: 'Inline named object item',
                type: 'object',
                name: 'item',
              },
              {
                title: 'Existing type object item',
                type: 'all-types',
              },
            ],
            type: 'array',
          },
        ],
        name: 'all-types',
        title: 'Basic doc',
        type: 'document',
      })
    })

    test('serialize array with type reference and overridden typename', () => {
      const arrayType = 'someArray'
      const objectBaseType = 'someObject'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: objectBaseType,
            type: 'object',
            fields: [
              defineField({
                name: 'title',
                type: 'string',
              }),
            ],
          }),
          defineType({
            name: arrayType,
            type: 'array',
            of: [{type: objectBaseType, name: 'override'}],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)

      const serializedDoc = extracted.find((serialized) => serialized.name === arrayType)
      expect(serializedDoc).toEqual({
        name: arrayType,
        of: [{title: 'Some Object', type: objectBaseType, name: 'override'}],
        type: 'array',
      })
    })

    test('serialize schema with indirectly recursive structure', () => {
      const arrayType = 'someArray'
      const objectBaseType = 'someObject'
      const otherObjectType = 'other'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: objectBaseType,
            type: 'object',
            fields: [
              defineField({
                name: 'recurse',
                type: otherObjectType,
              }),
            ],
          }),
          defineType({
            name: otherObjectType,
            type: 'object',
            fields: [
              defineField({
                name: 'recurse2',
                type: arrayType,
              }),
            ],
          }),
          defineType({
            name: arrayType,
            type: 'array',
            of: [{type: objectBaseType}],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)

      expect(extracted).toEqual([
        {
          fields: [{name: 'recurse', type: 'other'}],
          name: 'someObject',
          type: 'object',
        },
        {
          fields: [{name: 'recurse2', type: 'someArray'}],
          name: 'other',
          type: 'object',
        },
        {
          name: 'someArray',
          of: [{type: 'someObject'}],
          type: 'array',
        },
      ])
    })

    test('serialize portable text field', () => {
      const documentType = 'pt'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: documentType,
            type: 'document',
            fields: [
              defineField({
                title: 'Portable text',
                name: 'pt',
                type: 'array',
                of: [
                  defineArrayMember({
                    title: 'Block',
                    name: 'block',
                    type: 'block',
                    of: [
                      defineField({
                        title: 'Inline block',
                        name: 'inlineBlock',
                        type: 'object',
                        fields: [
                          defineField({
                            title: 'Inline value',
                            name: 'value',
                            type: 'string',
                          }),
                        ],
                      }),
                    ],
                    marks: {
                      annotations: [
                        defineField({
                          title: 'Annotation',
                          name: 'annotation',
                          type: 'object',
                          fields: [
                            defineField({
                              title: 'Annotation value',
                              name: 'value',
                              type: 'string',
                            }),
                          ],
                        }),
                      ],
                      decorators: [{title: 'Custom mark', value: 'custom'}],
                    },
                    lists: [{value: 'bullet', title: 'Bullet list'}],
                    styles: [{value: 'customStyle', title: 'Custom style'}],
                  }),
                ],
              }),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)

      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        fields: [
          {
            name: 'pt',
            of: [
              {
                lists: [{title: 'Bullet list', value: 'bullet'}],
                marks: {
                  annotations: [
                    {
                      fields: [{name: 'value', title: 'Annotation value', type: 'string'}],
                      name: 'annotation',
                      type: 'object',
                    },
                  ],
                  decorators: [{title: 'Custom mark', value: 'custom'}],
                },
                of: [
                  {
                    fields: [{name: 'value', title: 'Inline value', type: 'string'}],
                    name: 'inlineBlock',
                    title: 'Inline block',
                    type: 'object',
                  },
                ],
                styles: [
                  {title: 'Normal', value: 'normal'},
                  {title: 'Custom style', value: 'customStyle'},
                ],
                type: 'block',
              },
            ],
            title: 'Portable text',
            type: 'array',
          },
        ],
        name: 'pt',
        type: 'document',
      })
    })

    test('serialize fields with references', () => {
      const documentType = 'ref-types'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: documentType,
            type: 'document',
            fields: [
              defineField({
                title: 'Reference to',
                name: 'reference',
                type: 'reference',
                to: [{type: documentType}],
              }),
              defineField({
                title: 'Cross dataset ref',
                name: 'crossDatasetReference',
                type: 'crossDatasetReference',
                dataset: 'production',
                studioUrl: () => 'cannot serialize studioUrl function',
                to: [
                  {
                    type: documentType,
                    preview: {
                      select: {title: 'title'},
                      prepare: () => ({
                        title: 'cannot serialize prepare function',
                      }),
                    },
                  },
                ],
              }),
              defineField({
                type: 'globalDocumentReference',
                name: 'globalRef',
                to: [
                  {
                    type: documentType,
                    preview: {
                      select: {title: 'title'},
                    },
                  },
                ],
                resourceId: 'a.b',
                resourceType: 'dataset',
                weak: true,
              }),
              defineField({
                title: 'Reference array',
                name: 'refArray',
                type: 'array',
                of: [
                  defineArrayMember({
                    title: 'Reference to',
                    name: 'reference',
                    type: 'reference',
                    to: [{type: documentType}],
                  }),
                ],
              }),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)

      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        fields: [
          {
            name: 'reference',
            title: 'Reference to',
            to: [{type: documentType}],
            type: 'reference',
          },
          {
            dataset: 'production',
            name: 'crossDatasetReference',
            title: 'Cross dataset ref',
            type: 'crossDatasetReference',
            to: [
              {
                type: documentType,
                preview: {
                  select: {title: 'title'},
                },
              },
            ],
          },
          {
            type: 'globalDocumentReference',
            name: 'globalRef',
            weak: true,
            to: [
              {
                type: documentType,
                preview: {
                  select: {title: 'title'},
                },
              },
            ],
            resourceId: 'a.b',
            resourceType: 'dataset',
          },
          {
            name: 'refArray',
            of: [
              {
                title: 'Reference to',
                to: [{type: documentType}],
                type: 'reference',
              },
            ],
            title: 'Reference array',
            type: 'array',
          },
        ],
        name: documentType,
        type: 'document',
      })
    })

    test('fieldsets and fieldset on fields is serialized', () => {
      const documentType = 'basic'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: documentType,
            type: 'document',
            fieldsets: [
              {
                name: 'test',
                title: 'Test fieldset',
                hidden: false,
                readOnly: true,
                options: {
                  collapsed: true,
                },
                description: 'my fieldset',
              },
              {
                name: 'conditional',
                hidden: () => true,
                readOnly: () => true,
              },
            ],
            fields: [
              defineField({name: 'title', type: 'string', fieldset: 'test'}),
              defineField({name: 'other', type: 'string', fieldset: 'conditional'}),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        fields: [
          {
            fieldset: 'test',
            name: 'title',
            type: 'string',
          },
          {
            fieldset: 'conditional',
            name: 'other',
            type: 'string',
          },
        ],
        fieldsets: [
          {
            description: 'my fieldset',
            hidden: false,
            name: 'test',
            options: {
              collapsed: true,
            },
            readOnly: true,
            title: 'Test fieldset',
          },
          {
            hidden: 'conditional',
            name: 'conditional',
            readOnly: 'conditional',
          },
        ],
        name: 'basic',
        type: 'document',
      })
    })

    test('do not serialize default titles (default titles added by Schema.compile based on type/field name)', () => {
      const documentType = 'basic-document'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: documentType,
            type: 'document',
            fieldsets: [
              {name: 'someFieldset'},
              {
                name: 'conditional',
                hidden: () => true,
                readOnly: () => true,
              },
            ],
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({name: 'someField', type: 'array', of: [{type: 'string'}]}),
              defineField({name: 'customTitleField', type: 'string', title: 'Custom'}),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const serializedDoc = extracted.find((serialized) => serialized.name === documentType)
      expect(serializedDoc).toEqual({
        fields: [
          {name: 'title', type: 'string'},
          {name: 'someField', of: [{type: 'string'}], type: 'array'},
          {name: 'customTitleField', type: 'string', title: 'Custom'},
        ],
        name: 'basic-document',
        type: 'document',
      })
    })

    test('should use the inline type, not the global type for the array.of name-conflicting inline array object items', () => {
      const documentType = 'basic-document'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            type: 'object',
            name: 'reusedObjectName', // this is the same as the item in conflictingInlineObjectNameArray below, but it has different fields
            fields: [{name: 'number', type: 'number'}],
          }),
          defineType({
            name: documentType,
            type: 'document',
            fields: [
              defineField({
                name: 'conflictingInlineObjectNameArray',
                type: 'array',
                of: [
                  defineArrayMember({
                    type: 'object',
                    // this is the type name as the object type above, but it is a different type, since this is an inline array item object def
                    name: 'reusedObjectName',
                    fields: [{name: 'string', type: 'string'}],
                  }),
                ],
              }),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      expect(extracted).toEqual([
        {
          type: 'object',
          name: 'reusedObjectName', // this is the same as the item in conflictingInlineObjectNameArray below, but it has different fields
          fields: [{name: 'number', type: 'number'}],
        },
        {
          name: documentType,
          type: 'document',
          fields: [
            {
              name: 'conflictingInlineObjectNameArray',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'reusedObjectName',
                  fields: [{name: 'string', type: 'string'}],
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
