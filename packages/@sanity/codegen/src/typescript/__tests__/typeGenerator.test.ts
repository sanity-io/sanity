import path from 'node:path'

import {describe, expect, test} from '@jest/globals'
import {
  createReferenceTypeNode,
  type DocumentSchemaType,
  type ObjectAttribute,
  type ObjectTypeNode,
  type SchemaType,
  type StringTypeNode,
  type TypeNode,
} from 'groq-js'

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
};"
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
};"
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
};"
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
};"
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
};"
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
};"
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
};"
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
    _type: \\"reference\\";
    _weak?: boolean;
    [internalGroqTypeReferenceTo]?: \\"author\\";
  };
};

export type Author = {
  name: string;
};"
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
};"
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
};"
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

    const typeGenerator = new TypeGenerator([])
    const objectNodeOut = typeGenerator.generateTypeNodeTypes('myObject', objectNode)
    expect(objectNodeOut).toMatchSnapshot()

    const someOtherTypeOut = typeGenerator.generateTypeNodeTypes('someOtherType', {
      type: 'inline',
      name: 'myObject',
    })
    expect(someOtherTypeOut).toMatchSnapshot()
  })
})
