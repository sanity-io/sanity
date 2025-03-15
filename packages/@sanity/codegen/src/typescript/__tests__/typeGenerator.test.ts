import path from 'node:path'

import {
  createReferenceTypeNode,
  type DocumentSchemaType,
  type ObjectAttribute,
  type ObjectTypeNode,
  type SchemaType,
  type StringTypeNode,
  type TypeNode,
} from 'groq-js'
import {describe, expect, test} from 'vitest'

import {readSchema} from '../../readSchema'
import {TypeGenerator} from '../typeGenerator'

describe('generateSchemaTypes', () => {
  test('should generate TypeScript type declarations for a schema', async () => {
    const schema = await readSchema(path.join(__dirname, 'fixtures', 'schema.json'))

    const typeGenerator = new TypeGenerator(schema)
    const typeDeclarations = typeGenerator.generateSchemaTypes()

    expect(typeDeclarations).toMatchSnapshot()
  })

  test('can generate well known types', async () => {
    const typeDeclarations = TypeGenerator.generateKnownTypes()

    expect(typeDeclarations).toMatchSnapshot()
  })

  test('should generate correct types for document schema with string fields', () => {
    const schema: SchemaType = [
      {
        type: 'document',
        name: 'author',
        attributes: {
          _id: {
            type: 'objectAttribute',
            value: {type: 'string'},
          },
          name: {
            type: 'objectAttribute',
            value: {type: 'string'},
            optional: true,
          },
        },
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type Author = {
  _id: string;
  name?: string;
};

export type AllSanitySchemaTypes = Author;"
`)
  })

  test('should generate correct types for document schema with number fields', () => {
    const schema: SchemaType = [
      {
        type: 'document',
        name: 'product',
        attributes: {
          price: {
            type: 'objectAttribute',
            value: {type: 'number'},
          },
        },
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type Product = {
  price: number;
};

export type AllSanitySchemaTypes = Product;"
`)
  })

  test('should generate correct types for document schema with boolean fields', () => {
    const schema: SchemaType = [
      {
        type: 'document',
        name: 'task',
        attributes: {
          completed: {
            type: 'objectAttribute',
            value: {type: 'boolean'},
          },
        },
      },
    ]
    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type Task = {
  completed: boolean;
};

export type AllSanitySchemaTypes = Task;"
`)
  })

  test('should generate correct types for document schema with object fields', () => {
    const schema: SchemaType = [
      {
        type: 'document',
        name: 'user',
        attributes: {
          address: {
            type: 'objectAttribute',
            value: {
              type: 'object',
              attributes: {
                street: {
                  type: 'objectAttribute',
                  value: {type: 'string'},
                },
                city: {
                  type: 'objectAttribute',
                  value: {type: 'string'},
                },
              },
            },
          },
        },
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type User = {
  address: {
    street: string;
    city: string;
  };
};

export type AllSanitySchemaTypes = User;"
`)
  })

  test('should generate correct types for document schema with array fields', () => {
    const schema: SchemaType = [
      {
        type: 'document',
        name: 'blogPost',
        attributes: {
          tags: {
            type: 'objectAttribute',
            value: {
              type: 'array',
              of: {type: 'string'},
            },
          },
        },
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type BlogPost = {
  tags: Array<string>;
};

export type AllSanitySchemaTypes = BlogPost;"
`)
  })

  test('should generate correct types for document schema with unknown fields', () => {
    const schema: SchemaType = [
      {
        type: 'document',
        name: 'dynamicData',
        attributes: {
          metadata: {
            type: 'objectAttribute',
            value: {type: 'unknown'},
          },
        },
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type DynamicData = {
  metadata: unknown;
};

export type AllSanitySchemaTypes = DynamicData;"
`)
  })

  test('should generate correct types for document schema with never fields', () => {
    const schema: SchemaType = [
      {
        type: 'document',
        name: 'impossible',
        attributes: {
          willNotHappen: {
            type: 'objectAttribute',
            value: {type: 'null'},
          },
        },
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type Impossible = {
  willNotHappen: null;
};

export type AllSanitySchemaTypes = Impossible;"
`)
  })

  test('should generate correct types for document schema with custom type references', () => {
    const blogPost = {
      type: 'document',
      name: 'blogPost',
      attributes: {
        author: {
          type: 'objectAttribute',
          value: createReferenceTypeNode('author'),
        } satisfies ObjectAttribute<ObjectTypeNode>,
      },
    } satisfies DocumentSchemaType
    const author = {
      type: 'document',
      name: 'author',
      attributes: {
        name: {
          type: 'objectAttribute',
          value: {type: 'string'},
        } satisfies ObjectAttribute<StringTypeNode>,
      },
    } satisfies DocumentSchemaType
    const schema = [blogPost, author] satisfies SchemaType

    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
      "export type BlogPost = {
        author: {
          _ref: string;
          _type: "reference";
          _weak?: boolean;
          [internalGroqTypeReferenceTo]?: "author";
        };
      };

      export type Author = {
        name: string;
      };

      export type AllSanitySchemaTypes = BlogPost | Author;"
    `)
  })

  test('should generate correct types for document schema with union fields', () => {
    const schema: SchemaType = [
      {
        type: 'document',
        name: 'mixedContent',
        attributes: {
          content: {
            type: 'objectAttribute',
            value: {
              type: 'union',
              of: [{type: 'string'}, {type: 'number'}],
            },
          },
        },
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type MixedContent = {
  content: string | number;
};

export type AllSanitySchemaTypes = MixedContent;"
`)
  })

  test('should generate correct types for document schema with nullable attribute', () => {
    const schema: SchemaType = [
      {
        type: 'document',
        name: 'optionalData',
        attributes: {
          obsoleteField: {
            type: 'objectAttribute',
            value: {type: 'null'},
          },
        },
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    const actualOutput = typeGenerator.generateSchemaTypes()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type OptionalData = {
  obsoleteField: null;
};

export type AllSanitySchemaTypes = OptionalData;"
`)
  })

  describe('generateTypeNodeTypes', () => {
    const typeGenerator = new TypeGenerator([])
    test.each(['string', 'boolean', 'number', 'unknown', 'null'] as const)(
      'should be able to generate types for type nodes: %s',
      (typeName) => {
        const out = typeGenerator.generateTypeNodeTypes('test', {
          type: typeName,
        } satisfies TypeNode)

        expect(out).toMatchSnapshot()
      },
    )
  })

  test('should generate correct types for document schema with inline fields', () => {
    const objectNode = {
      type: 'object',
      attributes: {
        inlineField: {
          type: 'objectAttribute',
          value: {
            type: 'object',
            attributes: {
              test: {
                type: 'objectAttribute',
                value: {type: 'string'},
              },
            },
            rest: {
              type: 'inline',
              name: 'test',
            },
          },
        },
        unknownObject: {
          type: 'objectAttribute',
          value: {
            type: 'object',
            attributes: {
              test: {
                type: 'objectAttribute',
                value: {type: 'string'},
              },
            },
            rest: {
              type: 'unknown',
            },
          },
        },
        arrayField: {
          type: 'objectAttribute',
          value: {
            type: 'array',
            of: {type: 'string'},
          },
        },
        unionField: {
          type: 'objectAttribute',
          value: {
            type: 'union',
            of: [
              {
                type: 'object',
                attributes: {
                  test: {
                    type: 'objectAttribute',
                    value: {type: 'string'},
                  },
                },
              },
              {type: 'string'},
              {
                type: 'inline',
                name: 'test',
              },
            ],
          },
        },
      },
    } satisfies TypeNode

    const typeGenerator = new TypeGenerator([
      {
        type: 'type',
        name: 'test',
        value: {
          type: 'object',
          attributes: {test: {type: 'objectAttribute', value: {type: 'string'}}},
        },
      },
    ])
    const objectNodeOut = typeGenerator.generateTypeNodeTypes('myObject', objectNode)
    expect(objectNodeOut).toMatchSnapshot()

    const someOtherTypeOut = typeGenerator.generateTypeNodeTypes('SomeOtherType', {
      type: 'inline',
      name: 'myObject',
    })
    expect(someOtherTypeOut).toMatchSnapshot()
  })

  test('Adds a comment when missing referenced inline type', () => {
    const objectNode = {
      type: 'object',
      attributes: {
        test: {
          type: 'objectAttribute',
          value: {type: 'string'},
        },
      },
      rest: {
        type: 'inline',
        name: 'test',
      },
    } satisfies TypeNode

    const typeGenerator = new TypeGenerator([])
    const objectNodeOut = typeGenerator.generateTypeNodeTypes('myObject', objectNode)
    expect(objectNodeOut).toMatchSnapshot()
  })
})

describe('generateQueryMap', () => {
  test('should generate a map of query results', () => {
    const schema: SchemaType = []

    const queries = [
      {
        typeNode: {type: 'unknown'} satisfies TypeNode,
        query: '*[_type == "author"]',
      },
      {
        typeNode: {type: 'unknown'} satisfies TypeNode,
        query: '*[_type == "author"][0]',
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    typeGenerator.generateTypeNodeTypes('AuthorsResult', queries[0].typeNode)
    typeGenerator.generateTypeNodeTypes('FirstAuthorResult', queries[1].typeNode)

    const actualOutput = typeGenerator.generateQueryMap(queries)

    expect(actualOutput).toMatchInlineSnapshot(`
      "import "@sanity/client";
      declare module "@sanity/client" {
        interface SanityQueries {
          "*[_type == \\"author\\"]": AuthorsResult;
          "*[_type == \\"author\\"][0]": FirstAuthorResult;
        }
      }"
    `)
  })

  test('should generate a map of query results with duplicate type names', () => {
    const schema: SchemaType = []

    const queries = [
      {
        typeNode: {type: 'unknown'} satisfies TypeNode,
        query: '*[_type == "foo"]',
      },
      {
        typeNode: {type: 'unknown'} satisfies TypeNode,
        query: '*[_type == "bar"]',
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    typeGenerator.generateTypeNodeTypes('Foo', queries[0].typeNode)
    typeGenerator.generateTypeNodeTypes('Foo', queries[1].typeNode)

    const actualOutput = typeGenerator.generateQueryMap(queries)

    expect(actualOutput).toMatchInlineSnapshot(`
      "import "@sanity/client";
      declare module "@sanity/client" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": Foo;
          "*[_type == \\"bar\\"]": Foo_2;
        }
      }"
    `)
  })

  test('should generate a map of query results with duplicate query strings', () => {
    const schema: SchemaType = []

    const queries = [
      {
        typeNode: {type: 'unknown'} satisfies TypeNode,
        query: '*[_type == "foo"]',
      },
      {
        typeNode: {type: 'unknown'} satisfies TypeNode,
        query: '*[_type == "foo"]',
      },
    ]

    const typeGenerator = new TypeGenerator(schema)
    typeGenerator.generateTypeNodeTypes('Foo', queries[0].typeNode)
    typeGenerator.generateTypeNodeTypes('Bar', queries[1].typeNode)

    const actualOutput = typeGenerator.generateQueryMap(queries)

    expect(actualOutput).toMatchInlineSnapshot(`
      "import "@sanity/client";
      declare module "@sanity/client" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": Foo | Bar;
        }
      }"
    `)
  })

  test('should handle duplicate type names', () => {
    const typeGenerator = new TypeGenerator([
      {
        name: 'MyType',
        type: 'type',
        value: {type: 'string'},
      },
      {
        name: 'my.Type',
        type: 'type',
        value: {type: 'number'},
      },
    ])

    expect(typeGenerator.generateSchemaTypes()).toMatchInlineSnapshot(`
      "export type MyType = string;

      export type MyType_2 = number;

      export type AllSanitySchemaTypes = MyType | MyType_2;"
    `)

    expect(
      typeGenerator.generateTypeNodeTypes('inline', {type: 'inline', name: 'my.Type'}),
    ).toEqual('export type Inline = MyType_2;')
  })
})
