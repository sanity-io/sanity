/* eslint-disable max-nested-callbacks */
import {type DocumentSchemaType, type SchemaType} from 'groq-js'
import {describe, expect, it} from 'vitest'

import {type QueryExtractionResult} from '../findQueriesInPath'
import {TypeGenerator} from '../typeGenerator'

const post: DocumentSchemaType = {
  type: 'document',
  name: 'post',
  attributes: {
    _id: {type: 'objectAttribute', value: {type: 'string'}},
    _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
    _createdAt: {type: 'objectAttribute', value: {type: 'string'}},
    _updatedAt: {type: 'objectAttribute', value: {type: 'string'}},
    _rev: {type: 'objectAttribute', value: {type: 'string'}},
    title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
    description: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
  },
}
const inBoth: DocumentSchemaType = {
  type: 'document',
  name: 'inBoth',
  attributes: {
    _id: {type: 'objectAttribute', value: {type: 'string'}},
    _type: {type: 'objectAttribute', value: {type: 'string', value: 'inBoth'}},
    foo: {type: 'objectAttribute', value: {type: 'string'}},
  },
}
const justInA: DocumentSchemaType = {
  type: 'document',
  name: 'justInA',
  attributes: {
    _id: {type: 'objectAttribute', value: {type: 'string'}},
    _type: {type: 'objectAttribute', value: {type: 'string', value: 'justInA'}},
    foo: {type: 'objectAttribute', value: {type: 'string'}},
  },
}
const justInB: DocumentSchemaType = {
  type: 'document',
  name: 'justInB',
  attributes: {
    _id: {type: 'objectAttribute', value: {type: 'string'}},
    _type: {type: 'objectAttribute', value: {type: 'string', value: 'justInB'}},
    foo: {type: 'objectAttribute', value: {type: 'string'}},
  },
}
const collisionWithinSchemaFirst: DocumentSchemaType = {
  type: 'document',
  name: 'collision-within-schema',
  attributes: {
    _id: {type: 'objectAttribute', value: {type: 'string'}},
    _type: {
      type: 'objectAttribute',
      value: {type: 'string', value: 'collision-within-schema'},
    },
    foo: {type: 'objectAttribute', value: {type: 'string'}},
  },
}
const collisionWithinSchemaLast: DocumentSchemaType = {
  type: 'document',
  name: 'collision.within.schema',
  attributes: {
    _id: {type: 'objectAttribute', value: {type: 'string'}},
    _type: {
      type: 'objectAttribute',
      value: {type: 'string', value: 'collision.within.schema'},
    },
    foo: {type: 'objectAttribute', value: {type: 'string'}},
  },
}
const collisionAcrossSchemasFirst: DocumentSchemaType = {
  type: 'document',
  name: 'collision-across-schemas',
  attributes: {
    _id: {type: 'objectAttribute', value: {type: 'string'}},
    _type: {
      type: 'objectAttribute',
      value: {type: 'string', value: 'collision-across-schemas'},
    },
    foo: {type: 'objectAttribute', value: {type: 'string'}},
  },
}
const collisionAcrossSchemasLast: DocumentSchemaType = {
  type: 'document',
  name: 'collision.across.schemas',
  attributes: {
    _id: {type: 'objectAttribute', value: {type: 'string'}},
    _type: {
      type: 'objectAttribute',
      value: {type: 'string', value: 'collision.across.schemas'},
    },
    foo: {type: 'objectAttribute', value: {type: 'string'}},
  },
}

const schemaA: SchemaType = [
  post,
  inBoth,
  justInA,
  collisionWithinSchemaFirst,
  collisionWithinSchemaLast,
  collisionAcrossSchemasFirst,
]

const schemaB: SchemaType = [inBoth, justInB, collisionAcrossSchemasLast]

const queries1: QueryExtractionResult = {
  type: 'queries',
  filename: 'file1.ts',
  queries: [
    {
      name: 'query1',
      result: '*[_type == "inBoth"]',
      type: 'query',
    },
    {
      name: 'projection1',
      result: '{title, description}',
      type: 'projection',
    },
  ],
}

const queries2: QueryExtractionResult = {
  type: 'queries',
  filename: 'file2.ts',
  queries: [
    {
      name: 'query2',
      result: '*[_type == "justInA"][0]',
      type: 'query',
    },
    // Duplicate query string from queries1
    {
      name: 'query1Again',
      result: '*[_type == "inBoth"]',
      type: 'query',
    },
    {
      name: 'projection1Again',
      result: '{title, description}',
      type: 'projection',
    },
  ],
}

const mixedValidAndInvalidQueries: QueryExtractionResult = {
  type: 'queries',
  filename: 'mixedValidAndInvalidQueries.ts',
  queries: [
    {
      name: 'invalidQuery',
      result: 'not even a query',
      type: 'query',
    },
    {
      name: 'validQuery',
      result: '*[_type == "post"]',
      type: 'query',
    },
    {
      name: 'invalidProjection',
      result: 'not-a-valid-projection',
      type: 'projection',
    },
  ],
}

const errorQuery: QueryExtractionResult = {
  type: 'error',
  filename: 'error.ts',
  error: new Error('Test error'),
}

async function fromAsync<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = []
  for await (const item of iterable) {
    result.push(item)
  }
  return result
}

async function* createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    // Yield control briefly to simulate async behavior
    await new Promise((resolve) => setTimeout(resolve, 0))
    yield item
  }
}

describe('TypeGenerator', () => {
  it('throws an error if a schema has a duplicate type name', () => {
    expect(
      () =>
        new TypeGenerator({
          schemas: [
            {schema: [], schemaId: 'duplicate-schema-id'},
            {schema: [], schemaId: 'duplicate-schema-id'},
          ],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Duplicate schema ID "duplicate-schema-id". Schema IDs must be unique.]`,
    )
  })

  describe('getKnownTypes', () => {
    it('generates type helper imports and `internalGroqTypeReferenceTo`', () => {
      const generator = new TypeGenerator({schemas: []})

      expect(generator.getKnownTypes().code).toMatchInlineSnapshot(`
        "import "@sanity/client";

        import type { ProjectionBase } from "groq";

        export declare const internalGroqTypeReferenceTo: unique symbol;

        "
      `)
    })

    it('generates type helper imports to PickSchema and SchemaOrigin if there are more than one schema', () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
      })

      expect(generator.getKnownTypes().code).toMatchInlineSnapshot(`
        "import "@sanity/client";

        import type { ProjectionBase, PickSchema, SchemaOrigin } from "groq";

        export declare const internalGroqTypeReferenceTo: unique symbol;

        "
      `)
    })

    it("does not generate a '@sanity/client' import if the flag is false", () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
        overloadClientMethods: false, // <-- Disabled
      })

      const {code} = generator.getKnownTypes()
      expect(code).not.toContain('import "@sanity/client"')

      expect(code).toMatchInlineSnapshot(`
        "import type { ProjectionBase, PickSchema, SchemaOrigin } from "groq";

        export declare const internalGroqTypeReferenceTo: unique symbol;

        "
      `)
    })
  })

  describe('getSchemaTypeDeclarations', () => {
    it('generates all schema type declarations with a unique id', () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
      })

      const schemaTypeDeclarations = generator.getSchemaTypeDeclarations()
      const identifiers = schemaTypeDeclarations.map(({id, schemaIds}) => ({
        name: id.name,
        schemaIds,
      }))

      expect(identifiers).toEqual([
        {name: 'Post', schemaIds: ['schemaA']},
        {name: 'InBoth', schemaIds: ['schemaA', 'schemaB']},
        {name: 'JustInA', schemaIds: ['schemaA']},
        {name: 'CollisionWithinSchema', schemaIds: ['schemaA']},
        {name: 'CollisionWithinSchema_2', schemaIds: ['schemaA']},
        {name: 'CollisionAcrossSchemas', schemaIds: ['schemaA']},
        {name: 'JustInB', schemaIds: ['schemaB']},
        {name: 'CollisionAcrossSchemas_2', schemaIds: ['schemaB']},
      ])

      const code = schemaTypeDeclarations.map((i) => i.code).join('')
      expect(code).toMatchInlineSnapshot(`
        "export type Post = SchemaOrigin<{
          _id: string;
          _type: "post";
          _createdAt: string;
          _updatedAt: string;
          _rev: string;
          title?: string;
          description?: string;
        }, "schemaA">;

        export type InBoth = SchemaOrigin<{
          _id: string;
          _type: "inBoth";
          foo: string;
        }, "schemaA"> | SchemaOrigin<{
          _id: string;
          _type: "inBoth";
          foo: string;
        }, "schemaB">;

        export type JustInA = SchemaOrigin<{
          _id: string;
          _type: "justInA";
          foo: string;
        }, "schemaA">;

        export type CollisionWithinSchema = SchemaOrigin<{
          _id: string;
          _type: "collision-within-schema";
          foo: string;
        }, "schemaA">;

        export type CollisionWithinSchema_2 = SchemaOrigin<{
          _id: string;
          _type: "collision.within.schema";
          foo: string;
        }, "schemaA">;

        export type CollisionAcrossSchemas = SchemaOrigin<{
          _id: string;
          _type: "collision-across-schemas";
          foo: string;
        }, "schemaA">;

        export type JustInB = SchemaOrigin<{
          _id: string;
          _type: "justInB";
          foo: string;
        }, "schemaB">;

        export type CollisionAcrossSchemas_2 = SchemaOrigin<{
          _id: string;
          _type: "collision.across.schemas";
          foo: string;
        }, "schemaB">;

        "
      `)
    })

    it('does not wrap with SchemaOrigin if there is only one schema', () => {
      const generator = new TypeGenerator({
        schemas: [
          {
            schemaId: 'default',
            schema: [
              {
                type: 'document',
                name: 'post',
                attributes: {
                  _id: {type: 'objectAttribute', value: {type: 'string'}},
                  _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
                },
              },
            ],
            filename: 'schema.json',
          },
        ],
      })

      const schemaTypeDeclarations = generator.getSchemaTypeDeclarations()
      const code = schemaTypeDeclarations.map((i) => i.code).join('')
      expect(code).toMatchInlineSnapshot(`
        "export type Post = {
          _id: string;
          _type: "post";
        };

        "
      `)
    })
  })

  describe('getAllSanitySchemaTypesDeclaration', () => {
    it('generates the allSanitySchemaTypes declaration', () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
      })

      const allSanitySchemaTypesDeclaration = generator.getAllSanitySchemaTypesDeclaration()
      const code = allSanitySchemaTypesDeclaration.code
      expect(code).toMatchInlineSnapshot(`
        "export type AllSanitySchemaTypes = Post | InBoth | JustInA | CollisionWithinSchema | CollisionWithinSchema_2 | CollisionAcrossSchemas | JustInB | CollisionAcrossSchemas_2;

        "
      `)
    })
  })

  describe('getSchemaDeclarations', () => {
    it('generates the schema declarations', () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
      })

      const schemaDeclarations = generator.getSchemaDeclarations()
      const code = schemaDeclarations.map((i) => i.code).join('')
      expect(code).toMatchInlineSnapshot(`
        "// Source: schemaA.json
        // Schema ID: schemaA
        export type SchemaASchema = Post | PickSchema<InBoth, "schemaA"> | JustInA | CollisionWithinSchema | CollisionWithinSchema_2 | CollisionAcrossSchemas;

        // Source: schemaB.json
        // Schema ID: schemaB
        export type SchemaBSchema = PickSchema<InBoth, "schemaB"> | JustInB | CollisionAcrossSchemas_2;

        "
      `)
    })
  })

  describe('getAugmentedSchemasDeclarations', () => {
    it('generates a SanitySchemas declaration augmented to the groq module', () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
      })

      const augmentedSchemasDeclarations = generator.getAugmentedSchemasDeclarations()
      const code = augmentedSchemasDeclarations.code
      expect(code).toMatchInlineSnapshot(`
        "declare module "groq" {
          interface SanitySchemas {
            "schemaA": SchemaASchema;
            "schemaB": SchemaBSchema;
          }
        }

        "
      `)
    })

    it('does not generate augmentations if flags are false', () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
        augmentGroqModule: false, // <-- Disabled
        overloadClientMethods: false, // <-- Disabled
      })

      const augmentedCode = generator.getAugmentedSchemasDeclarations()
      expect(augmentedCode.code).toBe('') // Should be empty
    })
  })

  describe('getQueryFileCount', () => {
    it('returns the number of files processed', async () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
        queriesByFile: createAsyncIterable([{type: 'files', fileCount: 2}, queries1, queries2]),
      })

      await expect(generator.getQueryFileCount()).resolves.toEqual({fileCount: 2})
    })

    it('returns 0 when no queries are provided', async () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
      })

      await expect(generator.getQueryFileCount()).resolves.toEqual({fileCount: 0})
    })
  })

  describe('getQueryResultDeclarations', () => {
    it('generates the query result declarations', async () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
        queriesByFile: createAsyncIterable([queries1, queries2]),
      })

      const results = await fromAsync(generator.getQueryResultDeclarations())

      expect(results).toHaveLength(2)
      const [first, second] = results

      expect(first.filename).toBe('file1.ts')
      if (first.type === 'error') expect.fail()
      expect(first.queryResultDeclarations).toHaveLength(2)

      expect(second.filename).toBe('file2.ts')
      if (second.type === 'error') expect.fail()
      expect(second.queryResultDeclarations).toHaveLength(3)

      const code = results
        .flatMap((fileResult) => {
          if (fileResult.type === 'error') expect.fail()
          return fileResult.queryResultDeclarations?.map((declaration) => declaration.code) ?? []
        })
        .join('\n')

      // Snapshot the generated code for one of the results for simplicity
      expect(code).toMatchInlineSnapshot(`
        "// Source: file1.ts
        // Variable: query1
        // Query: *[_type == "inBoth"]
        export type Query1Result = SchemaOrigin<Array<{
          _id: string;
          _type: "inBoth";
          foo: string;
        }>, "schemaA"> | SchemaOrigin<Array<{
          _id: string;
          _type: "inBoth";
          foo: string;
        }>, "schemaB">;


        // Source: file1.ts
        // Variable: projection1
        // Projection: {title, description}
        export type Projection1ProjectionResult = SchemaOrigin<ProjectionBase<{
          title: string | null;
          description: string | null;
        }, "post">, "schemaA">;


        // Source: file2.ts
        // Variable: query2
        // Query: *[_type == "justInA"][0]
        export type Query2Result = SchemaOrigin<{
          _id: string;
          _type: "justInA";
          foo: string;
        } | null, "schemaA"> | SchemaOrigin<null, "schemaB">;


        // Source: file2.ts
        // Variable: query1Again
        // Query: *[_type == "inBoth"]
        export type Query1AgainResult = SchemaOrigin<Array<{
          _id: string;
          _type: "inBoth";
          foo: string;
        }>, "schemaA"> | SchemaOrigin<Array<{
          _id: string;
          _type: "inBoth";
          foo: string;
        }>, "schemaB">;


        // Source: file2.ts
        // Variable: projection1Again
        // Projection: {title, description}
        export type Projection1AgainProjectionResult = SchemaOrigin<ProjectionBase<{
          title: string | null;
          description: string | null;
        }, "post">, "schemaA">;

        "
      `)
    })

    it('does not crash when an individual query or file throws an error', async () => {
      const generator = new TypeGenerator({
        schemas: [{schemaId: 'default', schema: [post], filename: 'schema.json'}], // Simpler schema for this test
        queriesByFile: createAsyncIterable([mixedValidAndInvalidQueries, errorQuery]),
      })

      const results = await fromAsync(generator.getQueryResultDeclarations())

      expect(results).toHaveLength(4)
      const [invalidQueryResult, invalidProjectionResult, validQueryResult, testErrorResult] =
        results

      expect(invalidQueryResult).toMatchObject({
        error: {message: 'Syntax error in GROQ query at position 3'},
        filename: 'mixedValidAndInvalidQueries.ts',
      })

      expect(invalidProjectionResult).toMatchObject({
        error: {
          message:
            'Invalid projection syntax: Projections must be enclosed in curly braces, (e.g., "{_id, title}"). Received: "not-a-valid-projection"',
        },
        filename: 'mixedValidAndInvalidQueries.ts',
      })

      expect(validQueryResult).toMatchObject({
        filename: 'mixedValidAndInvalidQueries.ts',
        queryResultDeclarations: [{code: expect.stringContaining('export type ValidQueryResult')}],
      })

      expect(testErrorResult).toMatchObject({
        error: {message: 'Test error'},
        filename: 'error.ts',
      })
    })

    it('does not add SchemaOrigin if there is only one schema', async () => {
      const generator = new TypeGenerator({
        schemas: [{schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'}],
        queriesByFile: createAsyncIterable([queries1]),
      })

      const [first] = await fromAsync(generator.getQueryResultDeclarations())
      if (first.type === 'error') expect.fail()

      const [query1, projection1] = first.queryResultDeclarations!
      expect(query1.code).toMatchInlineSnapshot(`
        "// Source: file1.ts
        // Variable: query1
        // Query: *[_type == "inBoth"]
        export type Query1Result = Array<{
          _id: string;
          _type: "inBoth";
          foo: string;
        }>;

        "
      `)
      expect(projection1.code).toMatchInlineSnapshot(`
        "// Source: file1.ts
        // Variable: projection1
        // Projection: {title, description}
        export type Projection1ProjectionResult = ProjectionBase<{
          title: string | null;
          description: string | null;
        }, "post">;

        "
      `)
    })
  })

  describe('getAugmentedQueryResultsDeclarations', () => {
    it('generates the augmented query results declarations', async () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
        queriesByFile: createAsyncIterable([queries1, queries2]),
        augmentGroqModule: true,
        overloadClientMethods: true,
      })

      // Consume the query results first to populate internal state
      await fromAsync(generator.getQueryResultDeclarations())

      const augmentedCode = await generator.getAugmentedQueryResultsDeclarations()
      expect(augmentedCode.code).toMatchInlineSnapshot(`
        "declare module "@sanity/client" {
          interface SanityQueries {
            "*[_type == \\"inBoth\\"]": Query1Result | Query1AgainResult;
            "*[_type == \\"justInA\\"][0]": Query2Result;
          }
        }

        declare module "groq" {
          interface SanityQueries {
            "*[_type == \\"inBoth\\"]": Query1Result | Query1AgainResult;
            "*[_type == \\"justInA\\"][0]": Query2Result;
          }
          interface SanityProjections {
            "{title, description}": Projection1ProjectionResult | Projection1AgainProjectionResult;
          }
        }

        "
      `)
    })

    it('does not generate augmentations if flags are false', async () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
        queriesByFile: createAsyncIterable([queries1]),
        augmentGroqModule: false, // <-- Disabled
        overloadClientMethods: false, // <-- Disabled
      })

      const augmentedCode = await generator.getAugmentedQueryResultsDeclarations()
      expect(augmentedCode.code).toBe('') // Should be empty
    })

    it("does not generate 'groq' module declaration if the flag is false", async () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
        queriesByFile: createAsyncIterable([queries1]),
        augmentGroqModule: false, // <-- Disabled
      })

      const {code} = await generator.getAugmentedQueryResultsDeclarations()

      expect(code).not.toContain('declare module "groq"')

      expect(code).toMatchInlineSnapshot(`
        "declare module "@sanity/client" {
          interface SanityQueries {
            "*[_type == \\"inBoth\\"]": Query1Result;
          }
        }

        "
      `)
    })

    it("does not generate '@sanity/client' module declaration if the flag is false", async () => {
      const generator = new TypeGenerator({
        schemas: [
          {schemaId: 'schemaA', schema: schemaA, filename: 'schemaA.json'},
          {schemaId: 'schemaB', schema: schemaB, filename: 'schemaB.json'},
        ],
        queriesByFile: createAsyncIterable([queries1]),
        overloadClientMethods: false, // <-- Disabled
      })

      const {code} = await generator.getAugmentedQueryResultsDeclarations()

      expect(code).not.toContain('declare module "@sanity/client"')

      expect(code).toMatchInlineSnapshot(`
        "declare module "groq" {
          interface SanityQueries {
            "*[_type == \\"inBoth\\"]": Query1Result;
          }
          interface SanityProjections {
            "{title, description}": Projection1ProjectionResult;
          }
        }

        "
      `)
    })
  })
})
