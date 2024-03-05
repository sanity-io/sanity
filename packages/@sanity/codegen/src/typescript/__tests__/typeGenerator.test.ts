import path from 'node:path'

import {describe, expect, test} from '@jest/globals'
import {
  createReferenceTypeNode,
  type DocumentSchemaType,
  type ObjectAttribute,
  type ObjectTypeNode,
  type SchemaType,
  type StringTypeNode,
} from 'groq-js'

import {readSchema} from '../../readSchema'
import {TypeGenerator} from '../typeGenerator'

describe('generateTypesFromSchema', () => {
  test('should generate TypeScript type declarations for a schema', async () => {
    const schema = await readSchema(path.join(__dirname, 'fixtures', 'schema.json'))

    const typeGenerator = new TypeGenerator(schema)
    const typeDeclarations = typeGenerator.generateTypesFromSchema()

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
    const actualOutput = typeGenerator.generateTypesFromSchema()

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
    const actualOutput = typeGenerator.generateTypesFromSchema()

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
    const actualOutput = typeGenerator.generateTypesFromSchema()

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
    const actualOutput = typeGenerator.generateTypesFromSchema()

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
    const actualOutput = typeGenerator.generateTypesFromSchema()

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
    const actualOutput = typeGenerator.generateTypesFromSchema()

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
    const actualOutput = typeGenerator.generateTypesFromSchema()

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
    const actualOutput = typeGenerator.generateTypesFromSchema()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type BlogPost = {
  author: {
    _ref: string;
    _weak?: boolean;
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
    const actualOutput = typeGenerator.generateTypesFromSchema()

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
    const actualOutput = typeGenerator.generateTypesFromSchema()

    expect(actualOutput).toMatchInlineSnapshot(`
"export type OptionalData = {
  obsoleteField: null;
};"
`)
  })
})
