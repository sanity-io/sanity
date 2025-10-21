import {defineField, defineType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {extractManifestSchemaTypes} from '../../src/_internal/manifest/extractWorkspaceManifest'
import {createSchema} from '../../src/core/schema/createSchema'

describe('Extract studio manifest', () => {
  describe('serialize validation rules', () => {
    test('object validation rules', () => {
      const docType = 'some-doc'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: docType,
            type: 'document',
            fields: [defineField({name: 'title', type: 'string'})],
            validation: (rule) => [
              rule
                .required()
                .custom(() => 'doesnt-matter')
                .warning('custom-warning'),
              rule.custom(() => 'doesnt-matter').error('custom-error'),
              rule.custom(() => 'doesnt-matter').info('custom-info'),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === docType)?.validation
      expect(validation).toEqual([
        {
          level: 'warning',
          message: 'custom-warning',
          rules: [{constraint: 'required', flag: 'presence'}, {flag: 'custom'}],
        },
        {
          level: 'error',
          message: 'custom-error',
          rules: [{flag: 'custom'}],
        },
        {
          level: 'info',
          message: 'custom-info',
          rules: [{flag: 'custom'}],
        },
      ])
    })

    test('array validation rules', () => {
      const type = 'someArray'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: type,
            type: 'array',
            of: [{type: 'string'}],
            validation: (rule) => [
              rule
                .required()
                .unique()
                .min(1)
                .max(10)
                .length(10)
                .custom(() => 'doesnt-matter'),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
        {
          level: 'error',
          rules: [
            {constraint: 'required', flag: 'presence'},
            {constraint: 1, flag: 'min'},
            {constraint: 10, flag: 'max'},
            {constraint: 10, flag: 'length'},
            {flag: 'custom'},
          ],
        },
      ])
    })

    test('boolean validation rules', () => {
      const type = 'someArray'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: type,
            type: 'boolean',
            validation: (rule) => [rule.required().custom(() => 'doesnt-matter')],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
        {
          level: 'error',
          rules: [{constraint: 'required', flag: 'presence'}, {flag: 'custom'}],
        },
      ])
    })

    test('date validation rules', () => {
      const type = 'someDate'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: type,
            type: 'date',
            validation: (rule) => [
              rule
                .required()
                .min('2022-01-01')
                .max('2022-01-02')
                .custom(() => 'doesnt-matter'),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
        {
          level: 'error',
          rules: [
            {constraint: 'required', flag: 'presence'},
            {constraint: '2022-01-01', flag: 'min'},
            {constraint: '2022-01-02', flag: 'max'},
            {flag: 'custom'},
          ],
        },
      ])
    })

    test('image validation rules', () => {
      const type = 'someImage'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: type,
            type: 'image',
            validation: (rule) => [
              rule
                .required()
                .assetRequired()
                .custom(() => 'doesnt-matter'),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
        {
          level: 'error',
          rules: [
            {constraint: 'required', flag: 'presence'},
            {constraint: {assetType: 'image'}, flag: 'assetRequired'},
            {flag: 'custom'},
          ],
        },
      ])
    })

    test('file validation rules', () => {
      const type = 'someFile'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: type,
            type: 'file',
            validation: (rule) => [
              rule
                .required()
                .assetRequired()
                .custom(() => 'doesnt-matter'),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
        {
          level: 'error',
          rules: [
            {constraint: 'required', flag: 'presence'},
            {constraint: {assetType: 'file'}, flag: 'assetRequired'},
            {flag: 'custom'},
          ],
        },
      ])
    })

    test('number validation rules', () => {
      const type = 'someNumber'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: type,
            type: 'number',
            validation: (rule) => [
              rule
                .custom(() => 'doesnt-matter')
                .required()
                .min(1)
                .max(2),
              rule.integer().positive(),
              rule.greaterThan(-4).negative(),
              rule.precision(2).lessThan(5),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
        {
          level: 'error',
          rules: [
            {flag: 'custom'},
            {constraint: 'required', flag: 'presence'},
            {constraint: 1, flag: 'min'},
            {constraint: 2, flag: 'max'},
          ],
        },
        {
          level: 'error',
          rules: [{constraint: 0, flag: 'min'}],
        },
        {
          level: 'error',
          rules: [
            {constraint: -4, flag: 'greaterThan'},
            {constraint: 0, flag: 'lessThan'},
          ],
        },
        {
          level: 'error',
          rules: [
            {constraint: 2, flag: 'precision'},
            {constraint: 5, flag: 'lessThan'},
          ],
        },
      ])
    })

    test('reference validation rules', () => {
      const type = 'someRef'
      const docType = 'doc'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            type: 'document',
            name: docType,
            fields: [
              defineField({
                type: 'string',
                name: 'title',
              }),
            ],
          }),
          defineType({
            name: type,
            type: 'reference',
            to: [{type: docType}],
            validation: (rule) => rule.required().custom(() => 'doesnt-matter'),
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
        {
          level: 'error',
          rules: [{constraint: 'required', flag: 'presence'}, {flag: 'custom'}],
        },
      ])
    })

    test('slug validation rules', () => {
      const type = 'someSlug'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: type,
            type: 'slug',
            validation: (rule) => rule.required().custom(() => 'doesnt-matter'),
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
        {
          level: 'error',
          rules: [
            {
              flag: 'custom', // this is the default unique checking rule
            },
            {
              constraint: 'required',
              flag: 'presence',
            },
            {
              flag: 'custom',
            },
          ],
        },
      ])
    })

    test('string validation rules', () => {
      const type = 'someString'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: type,
            type: 'string',
            validation: (rule) => [
              rule
                .required()
                .max(50)
                .min(5)
                .length(10)
                .uppercase()
                .lowercase()
                .regex(/a+/, 'test', {name: 'yeah', invert: true})
                .regex(/a+/, {name: 'yeah', invert: true})
                .regex(/a+/, 'test')
                .regex(/a+/)
                .email()
                .custom(() => 'doesnt-matter'),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
        {
          level: 'error',
          rules: [
            {constraint: 'required', flag: 'presence'},
            {constraint: 50, flag: 'max'},
            {constraint: 5, flag: 'min'},
            {constraint: 10, flag: 'length'},
            {constraint: 'uppercase', flag: 'stringCasing'},
            {constraint: 'lowercase', flag: 'stringCasing'},
            {
              constraint: {
                invert: false,
                name: 'test',
                pattern: '/a+/',
              },
              flag: 'regex',
            },
            {
              constraint: {
                invert: true,
                name: 'yeah',
                pattern: '/a+/',
              },
              flag: 'regex',
            },
            {
              constraint: {
                invert: false,
                name: 'test',
                pattern: '/a+/',
              },
              flag: 'regex',
            },
            {
              constraint: {
                invert: false,
                pattern: '/a+/',
              },
              flag: 'regex',
            },
            {
              flag: 'custom',
            },
          ],
        },
      ])
    })

    test('url validation rules', () => {
      const type = 'someUrl'
      const schema = createSchema({
        name: 'test',
        types: [
          defineType({
            name: type,
            type: 'url',
            validation: (rule) => [
              rule.required().custom(() => 'doesnt-matter'),
              rule.uri({scheme: 'ftp'}),
              rule.uri({
                scheme: ['https'],
                allowCredentials: true,
                allowRelative: true,
                relativeOnly: false,
              }),
              rule.uri({
                scheme: /^custom-protocol.*$/g,
              }),
            ],
          }),
        ],
      })

      const extracted = extractManifestSchemaTypes(schema)
      const validation = extracted.find((e) => e.name === type)?.validation
      expect(validation).toEqual([
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
            {
              constraint: 'required',
              flag: 'presence',
            },
            {
              flag: 'custom',
            },
          ],
        },
        {
          level: 'error',
          rules: [
            {
              constraint: {
                options: {
                  allowCredentials: false,
                  allowRelative: false,
                  relativeOnly: false,
                  scheme: ['/^ftp$/'],
                },
              },
              flag: 'uri',
            },
          ],
        },
        {
          level: 'error',
          rules: [
            {
              constraint: {
                options: {
                  allowCredentials: true,
                  allowRelative: true,
                  relativeOnly: false,
                  scheme: ['/^https$/'],
                },
              },
              flag: 'uri',
            },
          ],
        },
        {
          level: 'error',
          rules: [
            {
              constraint: {
                options: {
                  allowCredentials: false,
                  allowRelative: false,
                  relativeOnly: false,
                  scheme: ['/^custom-protocol.*$/g'],
                },
              },
              flag: 'uri',
            },
          ],
        },
      ])
    })
  })
})
