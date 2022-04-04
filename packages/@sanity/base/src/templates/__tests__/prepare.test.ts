import {prepareTemplates, defaultTemplatesForSchema} from '../'
import {schema} from './schema'

describe('getTemplates', () => {
  test('returns defaults if part is not implemented', () => {
    const templates = defaultTemplatesForSchema(schema)
    expect(templates).toMatchSnapshot()
  })

  test('returns defined templates if part implemented', () => {
    const templates = prepareTemplates(schema, [
      {
        id: 'author',
        title: 'Author',
        schemaType: 'author',
        value: {title: 'here'},
      },
      {
        serialize: () => ({
          id: 'developer',
          title: 'Developer',
          schemaType: 'developer',
          value: {title: 'Foo'},
        }),
      },
    ] as any)

    expect(templates).toMatchSnapshot()
  })

  test('validates that templates has ID', () => {
    expect(() =>
      prepareTemplates(schema, [
        {
          title: 'Author',
          schemaType: 'author',
          value: {title: 'here'},
        },
      ] as any)
    ).toThrow('Template "Author" is missing required properties: id')
  })

  test('validates that templates has title', () => {
    expect(() =>
      prepareTemplates(schema, [
        {
          id: 'author',
          schemaType: 'author',
          value: {title: 'here'},
        },
      ] as any)
    ).toThrow('Template "author" is missing required properties: title')
  })

  test('validates that templates has schema type', () => {
    expect(() =>
      prepareTemplates(schema, [
        {
          id: 'author',
          title: 'Author',
          value: {title: 'here'},
        },
      ] as any)
    ).toThrow('Template "author" is missing required properties: schemaType')
  })

  test('validates that templates has value', () => {
    expect(() =>
      prepareTemplates(schema, [
        {
          id: 'author',
          title: 'Author',
          schemaType: 'author',
        },
      ] as any)
    ).toThrow('Template "author" is missing required properties: value')
  })

  test('validates that templates has id, title, schemaType, value', () => {
    expect(() => prepareTemplates(schema, [{}] as any)).toThrow(
      'Template at index 0 is missing required properties: id, title, schemaType, value'
    )
  })

  test('validates that templates has an object/function value', () => {
    expect(() =>
      prepareTemplates(schema, [
        {
          id: 'author',
          title: 'Author',
          schemaType: 'author',
          value: [],
        },
        {
          id: 'person',
          title: 'Person',
          schemaType: 'person',
          value: [],
        },
      ] as any)
    ).toThrow(
      'Template "author" has an invalid "value" property; should be a function or an object'
    )
  })

  test('validates that templates has unique IDs', () => {
    expect(() =>
      prepareTemplates(schema, [
        {
          id: 'author',
          title: 'Author',
          schemaType: 'author',
          value: {name: 'Gunnar'},
        },
        {
          id: 'person',
          title: 'Person',
          schemaType: 'person',
        },
      ] as any)
    ).toThrow('Template "person" is missing required properties: value')
  })
})
