import type {StructureBuilder} from '@sanity/structure'
import type {TemplateBuilder} from '@sanity/initial-value-templates'

interface GetResultOptions {
  mockSchema: unknown
  mockNewDocumentStructure: (structureBuilder: typeof StructureBuilder) => unknown
  mockInitialValueTemplates: (templateBuilder: typeof TemplateBuilder) => unknown
}

beforeEach(() => {
  jest.resetAllMocks()
  jest.resetModules()
})

function getResult({
  mockSchema,
  mockNewDocumentStructure,
  mockInitialValueTemplates,
}: GetResultOptions) {
  jest.mock('part:@sanity/base/schema', () => {
    const createSchema = jest.requireActual('part:@sanity/base/schema-creator')
    return createSchema({types: mockSchema})
  })

  jest.mock('part:@sanity/base/initial-value-templates?', () => {
    const {TemplateBuilder: T} = require('@sanity/initial-value-templates')
    return mockInitialValueTemplates(T)
  })

  jest.mock('part:@sanity/base/new-document-structure?', () => {
    const {StructureBuilder: S} = require('@sanity/structure')
    return mockNewDocumentStructure(S)
  })

  const {
    getNewDocumentOptions,
  } = require('./getNewDocumentOptions') as typeof import('./getNewDocumentOptions')

  return getNewDocumentOptions()
}

describe('getNewDocumentOptions', () => {
  it('creates an array of new document options from the `new-document-structure` part', () => {
    const newDocumentOptions = getResult({
      mockSchema: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'role', type: 'string'},
          ],
        },
      ],

      mockInitialValueTemplates: (T) => [
        ...T.defaults(),

        T.template({
          id: 'author-developer',
          title: 'Developer',
          schemaType: 'author',
          value: {
            role: 'developer',
          },
        }),
      ],

      mockNewDocumentStructure: (S) => [S.initialValueTemplateItem('author-developer')],
    })

    expect(newDocumentOptions).toMatchObject([
      {
        icon: {},
        id: 'author-developer',
        schemaType: {name: 'author'},
        subtitle: 'Author',
        template: {
          id: 'author-developer',
          schemaType: 'author',
          title: 'Developer',
          value: {role: 'developer'},
        },
        templateId: 'author-developer',
        title: 'Developer',
        type: 'initialValueTemplateItem',
      },
    ])
  })

  it('throws if the structure does not return an array', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    getResult({
      mockSchema: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'role', type: 'string'},
          ],
        },
      ],

      mockInitialValueTemplates: (T) => T.defaults(),

      // not an array
      mockNewDocumentStructure: (S) => S.initialValueTemplateItem('author-developer'),
    })

    expect(consoleError.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Invalid "new document" configuration: "part:@sanity/base/new-document-structure" should return an array of items.. Falling back to default structure.',
      ],
    ])
  })

  it('throws if the template item is not an object', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    getResult({
      mockSchema: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'role', type: 'string'},
          ],
        },
      ],

      mockInitialValueTemplates: (T) => T.defaults(),

      mockNewDocumentStructure: () => ['not an object'],
    })

    expect(consoleError.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Expected template item at index 0 to be an object but got string. Falling back to default structure.',
      ],
    ])
  })

  it("throws if the type is not 'initialValueTemplateItem'", () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    getResult({
      mockSchema: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'role', type: 'string'},
          ],
        },
      ],

      mockInitialValueTemplates: (T) => T.defaults(),

      mockNewDocumentStructure: () => [{type: 'not-the-right-type'}],
    })

    expect(consoleError.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Only initial value template items are currently allowed in the new document structure. Item at index 0 is invalid. Falling back to default structure.',
      ],
    ])
  })

  it('throws if the there are two items with the same ID', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    getResult({
      mockSchema: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'role', type: 'string'},
          ],
        },
      ],

      mockInitialValueTemplates: (T) => T.defaults(),

      mockNewDocumentStructure: (S) => [
        S.initialValueTemplateItem('author'),
        S.initialValueTemplateItem('book'),
        S.initialValueTemplateItem('author'),
      ],
    })

    expect(consoleError.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Template item at index 2 has the same ID ("author") as template at index 0. Falling back to default structure.',
      ],
    ])
  })

  it("throws if there isn't a matching template for an item", () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    getResult({
      mockSchema: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'role', type: 'string'},
          ],
        },
      ],

      mockInitialValueTemplates: (T) => T.defaults(),

      mockNewDocumentStructure: (S) => [S.initialValueTemplateItem('no-matching-template')],
    })

    expect(consoleError.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Template "no-matching-template" not declared. Falling back to default structure.',
      ],
    ])
  })

  it("throws if there isn't a matching schema type for an item", () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    getResult({
      mockSchema: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'role', type: 'string'},
          ],
        },
      ],

      mockInitialValueTemplates: (T) => [
        T.template({
          id: 'has-no-schema-type',
          schemaType: "doesn't match nothing",
          title: 'Has no schema type',
          value: {},
        }),
      ],

      mockNewDocumentStructure: (S) => [S.initialValueTemplateItem('has-no-schema-type')],
    })

    expect(consoleError.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Schema type "doesn\'t match nothing" not declared. Falling back to default structure.',
      ],
    ])
  })

  it('excludes items where the schema type run through `isActionEnabled` returns false', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    getResult({
      mockSchema: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
          // eslint-disable-next-line camelcase
          __experimental_actions: [/*'create',*/ 'update', 'delete', 'publish'],
        },
        {
          name: 'author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'role', type: 'string'},
          ],
        },
      ],

      mockInitialValueTemplates: (T) => T.defaults(),

      mockNewDocumentStructure: (S) => [S.initialValueTemplateItem('book')],
    })

    expect(consoleError.mock.calls).toEqual([
      [
        'Template with ID "book" has schema type "book", where the "create" action is disabled and will not be included in the "new document"-dialog.',
      ],
    ])
  })

  it("excludes items where the template specifies parameters but the item doesn't include any", () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    getResult({
      mockSchema: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'author',
          type: 'document',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'role', type: 'string'},
          ],
        },
      ],

      mockInitialValueTemplates: (T) => [
        ...T.defaults(),
        T.template({
          id: 'with-parameters',
          schemaType: 'book',
          title: 'Book with params',
          value: {},
          parameters: [{name: 'authorId', type: 'string'}],
        }),
      ],

      mockNewDocumentStructure: (S) => [S.initialValueTemplateItem('with-parameters')],
    })

    expect(consoleError.mock.calls).toEqual([
      [
        'Template with ID "with-parameters" requires a set of parameters, but none were given. Skipping.',
      ],
    ])
  })
})
