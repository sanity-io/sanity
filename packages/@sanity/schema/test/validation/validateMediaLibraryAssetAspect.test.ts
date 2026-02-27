import {describe, expect, test} from 'vitest'

import {validateMediaLibraryAssetAspect} from '../../src/sanity/validateMediaLibraryAssetAspect'

describe('validateMediaLibraryAssetAspect', () => {
  describe('unsupported types', () => {
    test('should error on document type', () => {
      const aspect = {
        type: 'document',
        name: 'myDoc',
        fields: [{name: 'title', type: 'string'}],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toHaveLength(1)
      expect(errors[0][0].message).toContain('Type unsupported in Media Library aspects: document')
    })

    test('should error on image type', () => {
      const aspect = {
        type: 'image',
        name: 'myImage',
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('Type unsupported in Media Library aspects: image')
    })

    test('should error on file type', () => {
      const aspect = {
        type: 'file',
        name: 'myFile',
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('Type unsupported in Media Library aspects: file')
    })

    test('should error on reference type', () => {
      const aspect = {
        type: 'reference',
        name: 'myRef',
        to: [{type: 'document'}],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('Type unsupported in Media Library aspects: reference')
    })

    test('should error on crossDatasetReference type', () => {
      const aspect = {
        type: 'crossDatasetReference',
        name: 'myCrossRef',
        dataset: 'production',
        projectId: 'abc123',
        to: [{type: 'document'}],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain(
        'Type unsupported in Media Library aspects: cross dataset reference',
      )
    })
  })

  describe('conditional properties validation', () => {
    test('should error on hidden as function', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        hidden: () => true,
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"hidden" property cannot be a function')
    })

    test('should allow hidden as boolean', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        hidden: true,
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })

    test('should error on readOnly as function', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        readOnly: ({currentUser}: any) => !currentUser,
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"readOnly" property cannot be a function')
    })

    test('should allow readOnly as boolean', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        readOnly: false,
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })
  })

  describe('initialValue validation', () => {
    test('should error on initialValue as function', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        initialValue: () => 'default value',
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"initialValue" property cannot be a function')
    })

    test('should allow initialValue as static value', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        initialValue: 'default value',
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })
  })

  describe('validation property validation', () => {
    test('should error on validation as function', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        validation: (Rule: any) => Rule.required(),
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"validation" property cannot be a function')
    })

    test('should error on custom validation rule', () => {
      // Simulate a Rule object with custom validator
      const aspect = {
        type: 'string',
        name: 'myString',
        validation: {
          _rules: [
            {flag: 'custom', constraint: (value: any) => value === 'test' || 'Must be test'},
          ],
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('Custom validation functions are not supported')
    })

    test('should allow static validation rules', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        validation: {
          _rules: [{flag: 'required'}, {flag: 'min', constraint: 5}],
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })
  })

  describe('preview.prepare validation', () => {
    test('should error on preview.prepare function', () => {
      const aspect = {
        type: 'object',
        name: 'myObject',
        fields: [{name: 'title', type: 'string'}],
        preview: {
          select: {title: 'title'},
          prepare: ({title}: any) => ({title: title?.toUpperCase()}),
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"preview.prepare" property cannot be a function')
    })

    test('should allow preview.select without prepare', () => {
      const aspect = {
        type: 'object',
        name: 'myObject',
        fields: [{name: 'title', type: 'string'}],
        preview: {
          select: {title: 'title'},
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })
  })

  describe('components validation', () => {
    test('should error on components.input', () => {
      const TestComponent = () => null
      const aspect = {
        type: 'string',
        name: 'myString',
        components: {
          input: TestComponent,
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"components.input" property cannot be a component')
    })

    test('should error on components.field', () => {
      const TestComponent = () => null
      const aspect = {
        type: 'string',
        name: 'myString',
        components: {
          field: TestComponent,
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"components.field" property cannot be a component')
    })

    test('should error on components.item', () => {
      const TestComponent = () => null
      const aspect = {
        type: 'array',
        name: 'myArray',
        of: [{type: 'string'}],
        components: {
          item: TestComponent,
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"components.item" property cannot be a component')
    })

    test('should error on components.preview', () => {
      const TestComponent = () => null
      const aspect = {
        type: 'object',
        name: 'myObject',
        fields: [{name: 'title', type: 'string'}],
        components: {
          preview: TestComponent,
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"components.preview" property cannot be a component')
    })

    test('should error on multiple component properties', () => {
      const TestComponent = () => null
      const aspect = {
        type: 'object',
        name: 'myObject',
        fields: [{name: 'title', type: 'string'}],
        components: {
          input: TestComponent,
          field: TestComponent,
          preview: TestComponent,
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0].length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('options with functions validation', () => {
    test('should error on options.filter as function (reference type)', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        options: {
          filter: () => ({filter: '_type == "product"'}),
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain('"options.filter" property cannot be a function')
    })

    test('should error on slug options with functions', () => {
      const aspect = {
        type: 'slug',
        name: 'mySlug',
        options: {
          source: (doc: any) => doc.title,
          slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-'),
          isUnique: async () => true,
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0].length).toBe(3)
      const messages = errors[0].map((e) => e.message)
      expect(
        messages.some((m) => m.includes('"options.source" property cannot be a function')),
      ).toBe(true)
      expect(
        messages.some((m) => m.includes('"options.slugify" property cannot be a function')),
      ).toBe(true)
      expect(
        messages.some((m) => m.includes('"options.isUnique" property cannot be a function')),
      ).toBe(true)
    })

    test('should allow slug with static options', () => {
      const aspect = {
        type: 'slug',
        name: 'mySlug',
        options: {
          source: 'title',
          maxLength: 96,
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })

    test('should error on arbitrary function in options', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        options: {
          customHandler: () => 'test',
          transform: (val: any) => val.toUpperCase(),
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0].length).toBe(2)
    })
  })

  describe('nested fields validation', () => {
    test('should validate functions in nested object fields', () => {
      const aspect = {
        type: 'object',
        name: 'myObject',
        fields: [
          {
            name: 'nested',
            type: 'object',
            hidden: () => false,
            fields: [
              {
                name: 'deep',
                type: 'string',
                initialValue: () => 'default',
              },
            ],
          },
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(2) // One for outer hidden, one for inner initialValue
    })

    test('should validate functions in array of fields', () => {
      const aspect = {
        type: 'array',
        name: 'myArray',
        of: [
          {
            type: 'object',
            fields: [
              {
                name: 'title',
                type: 'string',
                hidden: ({parent}: any) => !parent,
              },
            ],
          },
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(
        errors[0].some((e) => e.message.includes('"hidden" property cannot be a function')),
      ).toBe(true)
    })
  })

  describe('fieldsets and groups validation', () => {
    test('should error on fieldset hidden as function', () => {
      const aspect = {
        type: 'object',
        name: 'myObject',
        fields: [{name: 'title', type: 'string', fieldset: 'main'}],
        fieldsets: [
          {
            name: 'main',
            title: 'Main',
            hidden: () => false,
          },
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain(
        'Fieldset at index 0 has a "hidden" property that cannot be a function',
      )
    })

    test('should error on fieldset readOnly as function', () => {
      const aspect = {
        type: 'object',
        name: 'myObject',
        fields: [{name: 'title', type: 'string', fieldset: 'main'}],
        fieldsets: [
          {
            name: 'main',
            title: 'Main',
            readOnly: ({currentUser}: any) => !currentUser?.isAdmin,
          },
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain(
        'Fieldset at index 0 has a "readOnly" property that cannot be a function',
      )
    })

    test('should error on group hidden as function', () => {
      const aspect = {
        type: 'object',
        name: 'myObject',
        fields: [{name: 'title', type: 'string', group: 'main'}],
        groups: [
          {
            name: 'main',
            title: 'Main',
            hidden: ({currentUser}: any) => !currentUser,
          },
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain(
        'Field group at index 0 has a "hidden" property that cannot be a function',
      )
    })

    test('should error on group icon as component', () => {
      const IconComponent = () => null
      const aspect = {
        type: 'object',
        name: 'myObject',
        fields: [{name: 'title', type: 'string', group: 'main'}],
        groups: [
          {
            name: 'main',
            title: 'Main',
            icon: IconComponent,
          },
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0][0].message).toContain(
        'Field group at index 0 has an "icon" property that cannot be a component',
      )
    })
  })

  describe('block type specific validation', () => {
    test('should error on block style component', () => {
      const StyleComponent = () => null
      const aspect = {
        type: 'block',
        name: 'myBlock',
        styles: [
          {title: 'Normal', value: 'normal'},
          {title: 'Custom', value: 'custom', component: StyleComponent},
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      // Block types create two error groups due to how groupProblems processes them
      expect(errors).toHaveLength(2)
      expect(errors[0][0].message).toContain('Block style at index 1 has a "component" property')
      expect(errors[1][0].message).toContain('Block style at index 1 has a "component" property')
    })

    test('should error on block decorator component', () => {
      const DecoratorComponent = () => null
      const aspect = {
        type: 'block',
        name: 'myBlock',
        marks: {
          decorators: [
            {title: 'Strong', value: 'strong'},
            {title: 'Custom', value: 'custom', component: DecoratorComponent},
          ],
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      // Block types create two error groups due to how groupProblems processes them
      expect(errors).toHaveLength(2)
      expect(errors[0][0].message).toContain(
        'Block decorator at index 1 has a "component" property',
      )
      expect(errors[1][0].message).toContain(
        'Block decorator at index 1 has a "component" property',
      )
    })

    test('should error on block annotation component', () => {
      const AnnotationComponent = () => null
      const aspect = {
        type: 'block',
        name: 'myBlock',
        marks: {
          annotations: [
            {
              name: 'customLink',
              type: 'object',
              fields: [{name: 'href', type: 'url'}],
              component: AnnotationComponent,
            },
          ],
        },
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      // Block types create two error groups due to how groupProblems processes them
      expect(errors).toHaveLength(2)
      expect(errors[0][0].message).toContain(
        'Block annotation at index 0 has a "component" property',
      )
      expect(errors[1][0].message).toContain(
        'Block annotation at index 0 has a "component" property',
      )
    })
  })

  describe('valid aspects', () => {
    test('should pass for valid string field', () => {
      const aspect = {
        type: 'string',
        name: 'myString',
        title: 'My String',
        description: 'A simple string field',
        initialValue: 'default',
        hidden: false,
        readOnly: false,
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })

    test('should pass for valid object with fields', () => {
      const aspect = {
        type: 'object',
        name: 'myObject',
        title: 'My Object',
        fields: [
          {name: 'title', type: 'string', title: 'Title'},
          {name: 'count', type: 'number', title: 'Count'},
          {name: 'isActive', type: 'boolean', title: 'Active'},
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })

    test('should pass for valid array', () => {
      const aspect = {
        type: 'array',
        name: 'myArray',
        title: 'My Array',
        of: [{type: 'string'}, {type: 'number'}],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })

    test('should pass for valid nested structure', () => {
      const aspect = {
        type: 'object',
        name: 'complexObject',
        fields: [
          {
            name: 'metadata',
            type: 'object',
            fields: [
              {name: 'created', type: 'datetime'},
              {name: 'author', type: 'string'},
            ],
          },
          {
            name: 'tags',
            type: 'array',
            of: [{type: 'string'}],
          },
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })
  })

  describe('multiple errors', () => {
    test('should collect all validation errors', () => {
      const TestComponent = () => null
      const aspect = {
        type: 'object',
        name: 'myObject',
        hidden: () => true,
        readOnly: ({currentUser}: any) => !currentUser,
        initialValue: () => ({}),
        preview: {
          prepare: () => ({title: 'test'}),
        },
        components: {
          input: TestComponent,
          field: TestComponent,
        },
        fields: [
          {
            name: 'title',
            type: 'string',
            hidden: () => false,
            validation: (Rule: any) => Rule.required(),
          },
          {
            name: 'slug',
            type: 'slug',
            options: {
              source: () => 'title',
              slugify: (str: string) => str.toLowerCase(),
            },
          },
        ],
      }

      const [isValid, errors] = validateMediaLibraryAssetAspect(aspect)

      expect(isValid).toBe(false)
      // Should have multiple error groups (root object + nested fields)
      expect(errors.length).toBeGreaterThan(1)

      // Flatten all errors to check messages
      const allErrors = errors.flat()
      const errorMessages = allErrors.map((e) => e.message)

      // Check for various error types
      expect(errorMessages.some((m) => m.includes('"hidden" property cannot be a function'))).toBe(
        true,
      )
      expect(
        errorMessages.some((m) => m.includes('"readOnly" property cannot be a function')),
      ).toBe(true)
      expect(
        errorMessages.some((m) => m.includes('"initialValue" property cannot be a function')),
      ).toBe(true)
      expect(
        errorMessages.some((m) => m.includes('"preview.prepare" property cannot be a function')),
      ).toBe(true)
      expect(
        errorMessages.some((m) => m.includes('"components.input" property cannot be a component')),
      ).toBe(true)
      expect(
        errorMessages.some((m) => m.includes('"components.field" property cannot be a component')),
      ).toBe(true)
      expect(
        errorMessages.some((m) => m.includes('"validation" property cannot be a function')),
      ).toBe(true)
      expect(
        errorMessages.some((m) => m.includes('"options.source" property cannot be a function')),
      ).toBe(true)
      expect(
        errorMessages.some((m) => m.includes('"options.slugify" property cannot be a function')),
      ).toBe(true)
    })
  })
})
