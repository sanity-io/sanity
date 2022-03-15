import T, {prepareTemplates} from '@sanity/initial-value-templates'
import {createStructureBuilder} from '@sanity/structure'
import {createSchema} from '../schema'
import {getNewDocumentOptions} from './getNewDocumentOptions'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

describe('getNewDocumentOptions', () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear()
  })

  // @todo For some reason, testing only work when running 1 test at a time

  it.only('creates an array of new document options from the `new-document-structure` part', () => {
    const schema = createSchema({
      name: 'test',
      types: [
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
    })

    const initialValueTemplates = prepareTemplates(schema, [
      ...T.defaults(schema),

      T.template({
        id: 'author-developer',
        title: 'Developer',
        schemaType: 'author',
        value: {
          role: 'developer',
        },
      }),
    ])

    const S = createStructureBuilder({initialValueTemplates, schema} as any)

    const newDocumentStructure = [S.initialValueTemplateItem('author-developer')]

    const newDocumentOptions = getNewDocumentOptions(
      S,
      schema,
      initialValueTemplates,
      newDocumentStructure
    )

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
    const schema = createSchema({
      name: 'test',
      types: [
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
    })

    const initialValueTemplates = prepareTemplates(schema, T.defaults(schema))
    const S = createStructureBuilder({initialValueTemplates, schema} as any)
    const newDocumentStructure = S.initialValueTemplateItem('author-developer')

    getNewDocumentOptions(S, schema, initialValueTemplates, newDocumentStructure)

    expect(consoleErrorSpy.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Invalid "new document" configuration: "part:@sanity/base/new-document-structure" should return an array of items.. Falling back to default structure.',
      ],
    ])
  })

  it('throws if the template item is not an object', () => {
    const schema = createSchema({
      name: 'test',
      types: [
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
    })

    const initialValueTemplates = prepareTemplates(schema, T.defaults(schema))
    const S = createStructureBuilder({initialValueTemplates, schema} as any)
    const newDocumentStructure = ['not an object']

    getNewDocumentOptions(S, schema, initialValueTemplates, newDocumentStructure)

    expect(consoleErrorSpy.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Expected template item at index 0 to be an object but got string. Falling back to default structure.',
      ],
    ])
  })

  it("throws if the type is not 'initialValueTemplateItem'", () => {
    const schema = createSchema({
      name: 'test',
      types: [
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
    })

    const initialValueTemplates = prepareTemplates(schema, T.defaults(schema))
    const S = createStructureBuilder({initialValueTemplates, schema} as any)
    const newDocumentStructure = [{type: 'not-the-right-type'}]

    getNewDocumentOptions(S, schema, initialValueTemplates, newDocumentStructure)

    expect(consoleErrorSpy.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Only initial value template items are currently allowed in the new document structure. Item at index 0 is invalid. Falling back to default structure.',
      ],
    ])
  })

  it('throws if the there are two items with the same ID', () => {
    const schema = createSchema({
      name: 'test',
      types: [
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
    })

    const initialValueTemplates = prepareTemplates(schema, T.defaults(schema))
    const S = createStructureBuilder({initialValueTemplates, schema} as any)
    const newDocumentStructure = [
      S.initialValueTemplateItem('author'),
      S.initialValueTemplateItem('book'),
      S.initialValueTemplateItem('author'),
    ]

    getNewDocumentOptions(S, schema, initialValueTemplates, newDocumentStructure)

    expect(consoleErrorSpy.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Template item at index 2 has the same ID ("author") as template at index 0. Falling back to default structure.',
      ],
    ])
  })

  it("throws if there isn't a matching template for an item", () => {
    const schema = createSchema({
      name: 'test',
      types: [
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
    })

    const initialValueTemplates = prepareTemplates(schema, T.defaults(schema))
    const S = createStructureBuilder({initialValueTemplates, schema} as any)
    const newDocumentStructure = [S.initialValueTemplateItem('no-matching-template')]

    getNewDocumentOptions(S, schema, initialValueTemplates, newDocumentStructure)

    expect(consoleErrorSpy.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Template "no-matching-template" not declared. Falling back to default structure.',
      ],
    ])
  })

  it("throws if there isn't a matching schema type for an item", () => {
    const schema = createSchema({
      name: 'test',
      types: [
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
    })

    const initialValueTemplates = prepareTemplates(schema, [
      T.template({
        id: 'has-no-schema-type',
        schemaType: "doesn't match nothing",
        title: 'Has no schema type',
        value: {},
      }),
    ])

    const S = createStructureBuilder({initialValueTemplates, schema} as any)
    const newDocumentStructure = [S.initialValueTemplateItem('has-no-schema-type')]

    getNewDocumentOptions(S, schema, initialValueTemplates, newDocumentStructure)

    expect(consoleErrorSpy.mock.calls).toEqual([
      [
        'Invalid "new document" configuration: Schema type "doesn\'t match nothing" not declared. Falling back to default structure.',
      ],
    ])
  })

  it('excludes items where the schema type run through `isActionEnabled` returns false', () => {
    const schema = createSchema({
      name: 'test',
      types: [
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
    })

    const initialValueTemplates = prepareTemplates(schema, T.defaults(schema))

    const S = createStructureBuilder({initialValueTemplates, schema} as any)
    const newDocumentStructure = [S.initialValueTemplateItem('book')]

    getNewDocumentOptions(S, schema, initialValueTemplates, newDocumentStructure)

    expect(consoleErrorSpy.mock.calls).toEqual([
      [
        'Template with ID "book" has schema type "book", where the "create" action is disabled and will not be included in the "new document"-dialog.',
      ],
    ])
  })

  it("excludes items where the template specifies parameters but the item doesn't include any", () => {
    const schema = createSchema({
      name: 'test',
      types: [
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
    })

    const initialValueTemplates = prepareTemplates(schema, [
      ...T.defaults(schema),
      T.template({
        id: 'with-parameters',
        schemaType: 'book',
        title: 'Book with params',
        value: {},
        parameters: [{name: 'authorId', type: 'string'}],
      }),
    ])

    const S = createStructureBuilder({initialValueTemplates, schema} as any)
    const newDocumentStructure = [S.initialValueTemplateItem('with-parameters')]

    getNewDocumentOptions(S, schema, initialValueTemplates, newDocumentStructure)

    expect(consoleErrorSpy.mock.calls).toEqual([
      [
        'Template with ID "with-parameters" requires a set of parameters, but none were given. Skipping.',
      ],
    ])
  })
})
