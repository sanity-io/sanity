/* eslint-disable dot-notation */
import EventEmitter from 'node:events'

import * as t from '@babel/types'
import {WorkerChannelReceiver, WorkerChannelReporter} from '@sanity/worker-channels'
import {type SchemaType} from 'groq-js'
import {describe, expect, test} from 'vitest'

import {TypeGenerator, type TypegenWorkerChannel} from '../typeGenerator'
import {type ExtractedModule, QueryExtractionError} from '../types'

// TODO: replace with Array.fromAsync once we drop support for node v20
// node v22 is the first version to support Array.fromAsync
async function ArrayFromAsync<T>(asyncIterable: AsyncIterable<T>) {
  const values: T[] = []
  for await (const item of asyncIterable) {
    values.push(item)
  }
  return values
}

async function* empty() {
  // intentionally empty
}

describe(TypeGenerator.name, () => {
  test('generates types and reports progress via a worker channel reporter', async () => {
    const emitter = new EventEmitter()
    const receiver = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter)
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'foo',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'foo'}},
          foo: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
      {
        type: 'document',
        name: 'bar',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'bar'}},
          bar: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    async function* getQueries(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/foo.ts',
        queries: [
          {
            filename: '/src/foo.ts',
            query: '*[_type == "foo"]',
            variable: {id: {type: 'Identifier', name: 'queryFoo'}},
          },
        ],
        documentProjections: [],
        errors: [],
      }
      yield {filename: '/src/no-queries', queries: [], documentProjections: [], errors: []}
      yield {
        filename: '/src/has-an-error',
        queries: [],
        documentProjections: [],
        errors: [
          new QueryExtractionError({
            type: 'query',
            filename: '/src/has-an-error',
            cause: new Error('Test Error'),
            variable: {id: {type: 'Identifier', name: 'hadAnError'}},
          }),
        ],
      }
      yield {
        filename: '/src/bar.ts',
        queries: [
          {
            filename: '/src/bar.ts',
            query: '*[_type == "bar"]',
            variable: {id: {type: 'Identifier', name: 'queryBar'}},
          },
        ],
        documentProjections: [],
        errors: [],
      }
    }

    const complete = typeGenerator.generateTypes({
      root: '/src',
      schema,
      schemaPath: '/src/changed-path/my-schema-path.json',
      queries: getQueries(),
      reporter: WorkerChannelReporter.from<TypegenWorkerChannel>(emitter),
    })

    const {
      allSanitySchemaTypesDeclaration,
      internalReferenceSymbol,
      schemaTypeDeclarations,
      schemaDeclarations,
      sanitySchemasDeclaration,
    } = await receiver.event.generatedSchemaTypes()

    expect(allSanitySchemaTypesDeclaration.code).toMatchInlineSnapshot(`
      "export type AllSanitySchemaTypes = Foo | Bar;

      "
    `)
    expect(internalReferenceSymbol.code).toMatchInlineSnapshot(`
      "export declare const internalGroqTypeReferenceTo: unique symbol;

      "
    `)
    expect(schemaTypeDeclarations.length).toBe(2)

    // Test the new DefaultSchema declaration
    expect(schemaDeclarations.length).toBe(1)
    const defaultSchemaDeclaration = schemaDeclarations[0]
    expect(defaultSchemaDeclaration.schemaId).toBe('default')
    expect(defaultSchemaDeclaration.code).toMatchInlineSnapshot(`
      "// Source: changed-path/my-schema-path.json
      export type DefaultSchema = Foo | Bar;

      "
    `)

    // Test the SanitySchemas declaration (should be empty since augmentGroqModule is not explicitly set to true)
    expect(sanitySchemasDeclaration.code).toMatchInlineSnapshot(`
      "// Schema TypeMap
      declare module "groq" {
        interface SanitySchemas {
          "default": DefaultSchema;
        }
      }

      "
    `)
    expect(sanitySchemasDeclaration.ast.body).toHaveLength(1)
    const [fooDeclaration, barDeclaration] = schemaTypeDeclarations

    expect(fooDeclaration).toMatchObject({
      id: {name: 'Foo'},
      name: 'foo',
      code: expect.stringContaining('export type Foo'),
    })
    expect(barDeclaration).toMatchObject({
      id: {name: 'Bar'},
      name: 'bar',
      code: expect.stringContaining('export type Bar'),
    })

    const evaluatedModules = await ArrayFromAsync(receiver.stream.evaluatedModules())
    expect(evaluatedModules.length).toBe(4)

    const [foo, noQueries, hasAnError, bar] = evaluatedModules

    // Assert foo module
    expect(foo.filename).toBe('/src/foo.ts')
    expect(foo.queries).toHaveLength(1)
    expect(foo.errors).toHaveLength(0)
    expect(foo.queries[0].variable.id.name).toBe('queryFoo')
    expect(foo.queries[0].query).toBe('*[_type == "foo"]')

    // Assert noQueries module
    expect(noQueries.filename).toBe('/src/no-queries')
    expect(noQueries.queries).toHaveLength(0)
    expect(noQueries.errors).toHaveLength(0)

    // Assert hasAnError module
    expect(hasAnError.filename).toBe('/src/has-an-error')
    expect(hasAnError.queries).toHaveLength(0)
    expect(hasAnError.errors).toHaveLength(1)
    expect(hasAnError.errors[0]).toBeInstanceOf(QueryExtractionError)

    // Assert bar module
    expect(bar.filename).toBe('/src/bar.ts')
    expect(bar.queries).toHaveLength(1)
    expect(bar.errors).toHaveLength(0)
    expect(bar.queries[0].variable.id.name).toBe('queryBar')
    expect(bar.queries[0].query).toBe('*[_type == "bar"]')

    const {queryMapDeclaration} = await receiver.event.generatedQueryTypes()

    expect(queryMapDeclaration.code).toMatchInlineSnapshot(`
      "// Query TypeMap
      declare module "@sanity/client" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": QueryFooResult;
          "*[_type == \\"bar\\"]": QueryBarResult;
        }
      }
      declare module "groq" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": QueryFooResult;
          "*[_type == \\"bar\\"]": QueryBarResult;
        }
      }

      "
    `)

    const {code} = await complete
    expect(code).toMatchInlineSnapshot(`
      "export declare const internalGroqTypeReferenceTo: unique symbol;

      export type Foo = {
        _id: string;
        _type: "foo";
        foo?: string;
      };

      export type Bar = {
        _id: string;
        _type: "bar";
        bar?: string;
      };

      export type AllSanitySchemaTypes = Foo | Bar;

      // Source: changed-path/my-schema-path.json
      export type DefaultSchema = Foo | Bar;

      // Source: foo.ts
      // Variable: queryFoo
      // Query: *[_type == "foo"]
      export type QueryFooResult = Array<{
        _id: string;
        _type: "foo";
        foo?: string;
      }>;

      // Source: bar.ts
      // Variable: queryBar
      // Query: *[_type == "bar"]
      export type QueryBarResult = Array<{
        _id: string;
        _type: "bar";
        bar?: string;
      }>;

      // Schema TypeMap
      declare module "groq" {
        interface SanitySchemas {
          "default": DefaultSchema;
        }
      }

      // Query TypeMap
      declare module "@sanity/client" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": QueryFooResult;
          "*[_type == \\"bar\\"]": QueryBarResult;
        }
      }
      declare module "groq" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": QueryFooResult;
          "*[_type == \\"bar\\"]": QueryBarResult;
        }
      }

      "
    `)
  })

  test('does not generate the query type map if `overloadClientMethods` is false', async () => {
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'foo',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'foo'}},
          foo: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
      {
        type: 'document',
        name: 'bar',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'bar'}},
          bar: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    async function* getQueries(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/foo.ts',
        queries: [
          {
            filename: '/src/foo.ts',
            query: '*[_type == "foo"]',
            variable: {id: {type: 'Identifier', name: 'queryFoo'}},
          },
        ],
        documentProjections: [],
        errors: [],
      }
      yield {
        filename: '/src/bar.ts',
        queries: [
          {
            filename: '/src/bar.ts',
            query: '*[_type == "bar"]',
            variable: {id: {type: 'Identifier', name: 'queryBar'}},
          },
        ],
        documentProjections: [],
        errors: [],
      }
    }

    const {code} = await typeGenerator.generateTypes({
      root: '/src',
      schema,
      overloadClientMethods: false,
      queries: getQueries(),
    })

    expect(code).toMatchInlineSnapshot(`
      "export declare const internalGroqTypeReferenceTo: unique symbol;

      export type Foo = {
        _id: string;
        _type: "foo";
        foo?: string;
      };

      export type Bar = {
        _id: string;
        _type: "bar";
        bar?: string;
      };

      export type AllSanitySchemaTypes = Foo | Bar;

      export type DefaultSchema = Foo | Bar;

      // Source: foo.ts
      // Variable: queryFoo
      // Query: *[_type == "foo"]
      export type QueryFooResult = Array<{
        _id: string;
        _type: "foo";
        foo?: string;
      }>;

      // Source: bar.ts
      // Variable: queryBar
      // Query: *[_type == "bar"]
      export type QueryBarResult = Array<{
        _id: string;
        _type: "bar";
        bar?: string;
      }>;

      // Schema TypeMap
      declare module "groq" {
        interface SanitySchemas {
          "default": DefaultSchema;
        }
      }

      // Query TypeMap
      declare module "groq" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": QueryFooResult;
          "*[_type == \\"bar\\"]": QueryBarResult;
        }
      }

      "
    `)
  })

  test('does not generate the query type map if no extracted queries are provided', async () => {
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'foo',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'foo'}},
          foo: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
      {
        type: 'document',
        name: 'bar',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'bar'}},
          bar: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    const {code} = await typeGenerator.generateTypes({
      root: '/src',
      schema,
    })

    expect(code).toMatchInlineSnapshot(`
      "export declare const internalGroqTypeReferenceTo: unique symbol;

      export type Foo = {
        _id: string;
        _type: "foo";
        foo?: string;
      };

      export type Bar = {
        _id: string;
        _type: "bar";
        bar?: string;
      };

      export type AllSanitySchemaTypes = Foo | Bar;

      export type DefaultSchema = Foo | Bar;

      // Schema TypeMap
      declare module "groq" {
        interface SanitySchemas {
          "default": DefaultSchema;
        }
      }

      "
    `)
  })

  test('memoizes getInternalReferenceSymbolDeclaration', async () => {
    const typeGenerator = new TypeGenerator()

    // Get the internal reference symbol multiple times
    const symbol1 = typeGenerator['getInternalReferenceSymbolDeclaration']()
    const symbol2 = typeGenerator['getInternalReferenceSymbolDeclaration']()
    const symbol3 = typeGenerator['getInternalReferenceSymbolDeclaration']()

    // Should return the exact same object instance (reference equality)
    expect(symbol1).toBe(symbol2)
    expect(symbol2).toBe(symbol3)
    expect(symbol1.id).toBe(symbol2.id)
    expect(symbol1.code).toBe(symbol2.code)
    expect(symbol1.ast).toBe(symbol2.ast)
  })

  test('recomputes memoized values when input parameters change', async () => {
    const typeGenerator = new TypeGenerator()

    const schema1: SchemaType = [
      {
        type: 'document',
        name: 'doc1',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'doc1'}},
        },
      },
    ]

    const schema2: SchemaType = [
      {
        type: 'document',
        name: 'doc2',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'doc2'}},
        },
      },
    ]

    const options1 = {
      schema: schema1,
      root: '/test-root',
      queries: empty(),
    }

    const options2 = {
      schema: schema2,
      root: '/test-root',
      queries: empty(),
    }

    const emitter1 = new EventEmitter()
    const emitter2 = new EventEmitter()
    const receiver1 = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter1)
    const receiver2 = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter2)
    const reporter1 = WorkerChannelReporter.from<TypegenWorkerChannel>(emitter1)
    const reporter2 = WorkerChannelReporter.from<TypegenWorkerChannel>(emitter2)

    await typeGenerator.generateTypes({...options1, reporter: reporter1})
    await typeGenerator.generateTypes({...options2, reporter: reporter2})

    // Get declarations with different schemas
    const {schemaTypeDeclarations: schemaTypeDeclarations1} =
      await receiver1.event.generatedSchemaTypes()
    const {schemaTypeDeclarations: schemaTypeDeclarations2} =
      await receiver2.event.generatedSchemaTypes()

    // Should return different instances when schema changes
    expect(schemaTypeDeclarations1).not.toBe(schemaTypeDeclarations2)
    expect(schemaTypeDeclarations1[0].name).toBe('doc1')
    expect(schemaTypeDeclarations2[0].name).toBe('doc2')
  })

  test('does not generate groq module augmentation when `augmentGroqModule` is false', async () => {
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'foo',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'foo'}},
          foo: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    async function* getQueries(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/foo.ts',
        queries: [
          {
            filename: '/src/foo.ts',
            query: '*[_type == "foo"]',
            variable: {id: {type: 'Identifier', name: 'queryFoo'}},
          },
        ],
        documentProjections: [],
        errors: [],
      }
    }

    const {code} = await typeGenerator.generateTypes({
      root: '/src',
      schema,
      augmentGroqModule: false,
      queries: getQueries(),
    })

    expect(code).toMatchInlineSnapshot(`
      "export declare const internalGroqTypeReferenceTo: unique symbol;

      export type Foo = {
        _id: string;
        _type: "foo";
        foo?: string;
      };

      export type AllSanitySchemaTypes = Foo;

      export type DefaultSchema = Foo;

      // Source: foo.ts
      // Variable: queryFoo
      // Query: *[_type == "foo"]
      export type QueryFooResult = Array<{
        _id: string;
        _type: "foo";
        foo?: string;
      }>;

      // Query TypeMap
      declare module "@sanity/client" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": QueryFooResult;
        }
      }

      "
    `)
  })

  test('generates both client and groq module augmentations when both options are true', async () => {
    const emitter = new EventEmitter()
    const receiver = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter)
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'foo',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'foo'}},
          foo: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    async function* getQueries(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/foo.ts',
        queries: [
          {
            filename: '/src/foo.ts',
            query: '*[_type == "foo"]',
            variable: {id: {type: 'Identifier', name: 'queryFoo'}},
          },
        ],
        documentProjections: [],
        errors: [],
      }
    }

    const complete = typeGenerator.generateTypes({
      root: '/src',
      schema,
      overloadClientMethods: true,
      augmentGroqModule: true,
      queries: getQueries(),
      reporter: WorkerChannelReporter.from<TypegenWorkerChannel>(emitter),
    })

    const {sanitySchemasDeclaration} = await receiver.event.generatedSchemaTypes()
    const {queryMapDeclaration} = await receiver.event.generatedQueryTypes()

    // Should generate SanitySchemas interface for @sanity/client
    expect(sanitySchemasDeclaration.code).toMatchInlineSnapshot(`
      "// Schema TypeMap
      declare module "groq" {
        interface SanitySchemas {
          "default": DefaultSchema;
        }
      }

      "
    `)

    // Should generate SanityQueries interface for both modules
    expect(queryMapDeclaration.code).toMatchInlineSnapshot(`
      "// Query TypeMap
      declare module "@sanity/client" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": QueryFooResult;
        }
      }
      declare module "groq" {
        interface SanityQueries {
          "*[_type == \\"foo\\"]": QueryFooResult;
        }
      }

      "
    `)

    await complete
  })

  test('does not generate module augmentations when both options are false', async () => {
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'foo',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'foo'}},
          foo: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    async function* getQueries(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/foo.ts',
        queries: [
          {
            filename: '/src/foo.ts',
            query: '*[_type == "foo"]',
            variable: {id: {type: 'Identifier', name: 'queryFoo'}},
          },
        ],
        documentProjections: [],
        errors: [],
      }
    }

    const {code} = await typeGenerator.generateTypes({
      root: '/src',
      schema,
      overloadClientMethods: false,
      augmentGroqModule: false,
      queries: getQueries(),
    })

    expect(code).toMatchInlineSnapshot(`
      "export declare const internalGroqTypeReferenceTo: unique symbol;

      export type Foo = {
        _id: string;
        _type: "foo";
        foo?: string;
      };

      export type AllSanitySchemaTypes = Foo;

      export type DefaultSchema = Foo;

      // Source: foo.ts
      // Variable: queryFoo
      // Query: *[_type == "foo"]
      export type QueryFooResult = Array<{
        _id: string;
        _type: "foo";
        foo?: string;
      }>;

      "
    `)
  })

  test('memoization works correctly with multiple generateTypes calls', async () => {
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'testDoc',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'testDoc'}},
        },
      },
    ]

    const stableQuery: ExtractedModule = {
      filename: '/src/test.ts',
      queries: [
        {
          filename: '/src/test.ts',
          query: '*[_type == "testDoc"]',
          variable: {id: t.identifier('testQuery')},
        },
      ],
      documentProjections: [],
      errors: [],
    }

    async function* getQueries() {
      yield stableQuery
    }

    const options = {
      schema,
      root: '/test-root',
    }

    const createReporterReceiver = () => {
      const emitter = new EventEmitter()
      const receiver = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter)
      const reporter = WorkerChannelReporter.from<TypegenWorkerChannel>(emitter)
      return {receiver, reporter}
    }

    const [e1, e2, e3] = Array.from({length: 4}).map(createReporterReceiver)

    const r1 = await typeGenerator.generateTypes({
      ...options,
      reporter: e1.reporter,
      queries: getQueries(),
    })
    const r2 = await typeGenerator.generateTypes({
      ...options,
      reporter: e2.reporter,
      queries: getQueries(),
    })
    const r3 = await typeGenerator.generateTypes({
      ...options,
      // shallow copy the schema
      schema: [...schema],
      reporter: e3.reporter,
      queries: getQueries(),
    })

    // should be identical because the content did not change and these are strings
    expect(r1.code).toBe(r2.code)
    expect(r2.code).toBe(r3.code)

    // these will always be different because the AST is generated on each call
    expect(r1.ast).not.toBe(r2.ast)
    expect(r2.ast).not.toBe(r3.ast)

    const s1 = await e1.receiver.event.generatedSchemaTypes()
    const s2 = await e2.receiver.event.generatedSchemaTypes()
    const s3 = await e3.receiver.event.generatedSchemaTypes()

    // the first two should be the same because the content did not change
    expect(s1.schemaTypeDeclarations).toBe(s2.schemaTypeDeclarations)
    // the last one should be different because the schema changed
    expect(s2.schemaTypeDeclarations).not.toBe(s3.schemaTypeDeclarations)

    const m1 = await ArrayFromAsync(e1.receiver.stream.evaluatedModules())
    const m2 = await ArrayFromAsync(e2.receiver.stream.evaluatedModules())
    const m3 = await ArrayFromAsync(e3.receiver.stream.evaluatedModules())

    // none of these will be the same because the array itself is generated on each call
    expect(m1).not.toBe(m2)
    expect(m2).not.toBe(m3)

    // however, since all of them have been yielded the same query, the
    // resulting TS type should be the same for all of them
    const t1 = m1
      .flatMap((m) => m.queries)
      .map((r) => r.tsType)
      .at(0)
    const t2 = m2
      .flatMap((m) => m.queries)
      .map((r) => r.tsType)
      .at(0)
    const t3 = m3
      .flatMap((m) => m.queries)
      .map((r) => r.tsType)
      .at(0)

    expect(t1).toBe(t2)
    // the schema is different which means the schema type generator interface
    // won't be the same
    expect(t2).not.toBe(t3)

    const q1 = await e1.receiver.event.generatedQueryTypes()
    const q2 = await e2.receiver.event.generatedQueryTypes()
    const q3 = await e3.receiver.event.generatedQueryTypes()

    expect(q1.queryMapDeclaration).not.toBe(q2.queryMapDeclaration)
    expect(q2.queryMapDeclaration).not.toBe(q3.queryMapDeclaration)
  })

  test('generates document projection types and imports', async () => {
    const emitter = new EventEmitter()
    const receiver = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter)
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'post',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
          title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
          content: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    async function* getModules(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/projections.ts',
        queries: [],
        documentProjections: [
          {
            filename: '/src/projections.ts',
            variable: {id: {type: 'Identifier', name: 'postSummary'}},
            documentTypes: ['post'],
            projection: '{_id, title}',
          },
        ],
        errors: [],
      }
    }

    const complete = typeGenerator.generateTypes({
      root: '/src',
      schema,
      queries: getModules(),
      reporter: WorkerChannelReporter.from<TypegenWorkerChannel>(emitter),
    })

    const evaluatedModules = await ArrayFromAsync(receiver.stream.evaluatedModules())
    expect(evaluatedModules).toHaveLength(1)

    const [module] = evaluatedModules
    expect(module.documentProjections).toHaveLength(1)
    expect(module.documentProjections[0].variable.id.name).toBe('postSummary')
    expect(module.documentProjections[0].projection).toBe('{_id, title}')

    const {documentProjectionMapDeclaration, importDeclarations} =
      await receiver.event.generatedQueryTypes()

    expect(importDeclarations.code).toMatchInlineSnapshot(`
      "import type { DocumentProjectionBase } from "groq";

      "
    `)

    expect(documentProjectionMapDeclaration.code).toMatchInlineSnapshot(`
      "// Document Projection TypeMap
      declare module "groq" {
        interface SanityDocumentProjections {
          "{_id, title}": PostSummaryResult;
        }
      }

      "
    `)

    const {code} = await complete
    expect(code).toMatchInlineSnapshot(`
      "import type { DocumentProjectionBase } from "groq";

      export declare const internalGroqTypeReferenceTo: unique symbol;

      export type Post = {
        _id: string;
        _type: "post";
        title?: string;
        content?: string;
      };

      export type AllSanitySchemaTypes = Post;

      export type DefaultSchema = Post;

      // Source: projections.ts
      // Variable: postSummary
      // Projection: {_id, title}
      export type PostSummaryResult = DocumentProjectionBase<{
        _id: string;
        title: string | null;
      }, "post">;

      // Schema TypeMap
      declare module "groq" {
        interface SanitySchemas {
          "default": DefaultSchema;
        }
      }

      // Document Projection TypeMap
      declare module "groq" {
        interface SanityDocumentProjections {
          "{_id, title}": PostSummaryResult;
        }
      }

      "
    `)
  })

  test('does not generate document projection imports when no projections exist', async () => {
    const emitter = new EventEmitter()
    const receiver = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter)
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'post',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
        },
      },
    ]

    async function* getModules(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/queries.ts',
        queries: [
          {
            filename: '/src/queries.ts',
            query: '*[_type == "post"]',
            variable: {id: {type: 'Identifier', name: 'allPosts'}},
          },
        ],
        documentProjections: [],
        errors: [],
      }
    }

    const complete = typeGenerator.generateTypes({
      root: '/src',
      schema,
      queries: getModules(),
      reporter: WorkerChannelReporter.from<TypegenWorkerChannel>(emitter),
    })

    const {importDeclarations, documentProjectionMapDeclaration} =
      await receiver.event.generatedQueryTypes()

    expect(importDeclarations.code).toBe('')
    expect(documentProjectionMapDeclaration.code).toBe('')

    const {code} = await complete
    expect(code).not.toContain('DocumentProjectionBase')
    expect(code).not.toContain('SanityDocumentProjections')
  })

  test('generates document projections for multiple document types', async () => {
    const emitter = new EventEmitter()
    const receiver = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter)
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'post',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
          title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
          content: {
            type: 'objectAttribute',
            value: {
              type: 'array',
              of: {
                type: 'object',
                attributes: {
                  _type: {type: 'objectAttribute', value: {type: 'string', value: 'block'}},
                },
              },
            },
            optional: true,
          },
        },
      },
      {
        type: 'document',
        name: 'article',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'article'}},
          title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
          content: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    async function* getModules(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/shared.ts',
        queries: [],
        documentProjections: [
          {
            filename: '/src/shared.ts',
            variable: {id: {type: 'Identifier', name: 'contentProjection'}},
            documentTypes: ['post', 'article'],
            projection: '{_type, title, content}',
          },
        ],
        errors: [],
      }
    }

    const complete = typeGenerator.generateTypes({
      root: '/src',
      schema,
      queries: getModules(),
      reporter: WorkerChannelReporter.from<TypegenWorkerChannel>(emitter),
    })

    const {documentProjectionMapDeclaration} = await receiver.event.generatedQueryTypes()

    expect(documentProjectionMapDeclaration.code).toMatchInlineSnapshot(`
      "// Document Projection TypeMap
      declare module "groq" {
        interface SanityDocumentProjections {
          "{_type, title, content}": ContentProjectionResult;
        }
      }

      "
    `)

    const {code} = await complete
    expect(code).toMatchInlineSnapshot(`
      "import type { DocumentProjectionBase } from "groq";

      export declare const internalGroqTypeReferenceTo: unique symbol;

      export type Post = {
        _id: string;
        _type: "post";
        title?: string;
        content?: Array<{
          _type: "block";
        }>;
      };

      export type Article = {
        _id: string;
        _type: "article";
        title?: string;
        content?: string;
      };

      export type AllSanitySchemaTypes = Post | Article;

      export type DefaultSchema = Post | Article;

      // Source: shared.ts
      // Variable: contentProjection
      // Projection: {_type, title, content}
      export type ContentProjectionResult = DocumentProjectionBase<{
        _type: "post";
        title: string | null;
        content: Array<{
          _type: "block";
        }> | null;
      }, "post"> | DocumentProjectionBase<{
        _type: "article";
        title: string | null;
        content: string | null;
      }, "article">;

      // Schema TypeMap
      declare module "groq" {
        interface SanitySchemas {
          "default": DefaultSchema;
        }
      }

      // Document Projection TypeMap
      declare module "groq" {
        interface SanityDocumentProjections {
          "{_type, title, content}": ContentProjectionResult;
        }
      }

      "
    `)
  })

  test('does not generate document projection map when augmentGroqModule is false', async () => {
    const emitter = new EventEmitter()
    const receiver = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter)
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'post',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
          title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    async function* getModules(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/projections.ts',
        queries: [],
        documentProjections: [
          {
            filename: '/src/projections.ts',
            variable: {id: {type: 'Identifier', name: 'postProjection'}},
            documentTypes: ['post'],
            projection: '{_id, title}',
          },
        ],
        errors: [],
      }
    }

    const complete = typeGenerator.generateTypes({
      root: '/src',
      schema,
      augmentGroqModule: false,
      queries: getModules(),
      reporter: WorkerChannelReporter.from<TypegenWorkerChannel>(emitter),
    })

    const {importDeclarations, documentProjectionMapDeclaration} =
      await receiver.event.generatedQueryTypes()

    expect(importDeclarations.code).toBe('')
    expect(documentProjectionMapDeclaration.code).toBe('')

    const {code} = await complete
    expect(code).toContain('export type PostProjectionResult = DocumentProjectionBase<')
    expect(code).not.toContain('interface SanityDocumentProjections')
    expect(code).toMatchInlineSnapshot(`
      "export declare const internalGroqTypeReferenceTo: unique symbol;

      export type Post = {
        _id: string;
        _type: "post";
        title?: string;
      };

      export type AllSanitySchemaTypes = Post;

      export type DefaultSchema = Post;

      // Source: projections.ts
      // Variable: postProjection
      // Projection: {_id, title}
      export type PostProjectionResult = DocumentProjectionBase<{
        _id: string;
        title: string | null;
      }, "post">;

      "
    `)
  })

  test('handles document projection evaluation errors', async () => {
    const emitter = new EventEmitter()
    const receiver = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter)
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'post',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
        },
      },
    ]

    async function* getModules(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/projections.ts',
        queries: [],
        documentProjections: [
          {
            filename: '/src/projections.ts',
            variable: {id: {type: 'Identifier', name: 'invalidProjection'}},
            documentTypes: ['nonExistentType'],
            projection: '{_id, title}',
          },
        ],
        errors: [],
      }
    }

    await typeGenerator.generateTypes({
      root: '/src',
      schema,
      queries: getModules(),
      reporter: WorkerChannelReporter.from<TypegenWorkerChannel>(emitter),
    })

    const evaluatedModules = await ArrayFromAsync(receiver.stream.evaluatedModules())
    expect(evaluatedModules).toHaveLength(1)

    const [module] = evaluatedModules
    expect(module.documentProjections).toHaveLength(0)
    expect(module.errors).toHaveLength(1)
    expect(module.errors[0]).toBeInstanceOf(Error)
    expect(module.errors[0].message).toContain(
      "Unexpected result while evaluating projection for document type 'nonExistentType'",
    )
  })

  test('generates unique type names for duplicate projection variable names', async () => {
    const emitter = new EventEmitter()
    const receiver = WorkerChannelReceiver.from<TypegenWorkerChannel>(emitter)
    const typeGenerator = new TypeGenerator()

    const schema: SchemaType = [
      {
        type: 'document',
        name: 'post',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
          title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
        },
      },
    ]

    async function* getModules(): AsyncGenerator<ExtractedModule> {
      yield {
        filename: '/src/projections.ts',
        queries: [],
        documentProjections: [
          {
            filename: '/src/projections.ts',
            variable: {id: {type: 'Identifier', name: 'projection'}},
            documentTypes: ['post'],
            projection: '{_id}',
          },
          {
            filename: '/src/projections.ts',
            variable: {id: {type: 'Identifier', name: 'projection'}},
            documentTypes: ['post'],
            projection: '{title}',
          },
        ],
        errors: [],
      }
    }

    const complete = typeGenerator.generateTypes({
      root: '/src',
      schema,
      queries: getModules(),
      reporter: WorkerChannelReporter.from<TypegenWorkerChannel>(emitter),
    })

    const evaluatedModules = await ArrayFromAsync(receiver.stream.evaluatedModules())
    const [module] = evaluatedModules

    expect(module.documentProjections).toHaveLength(2)
    expect(module.documentProjections[0].id.name).toBe('ProjectionResult')
    expect(module.documentProjections[1].id.name).toBe('ProjectionResult_2')

    const {code} = await complete
    expect(code).toContain('export type ProjectionResult =')
    expect(code).toContain('export type ProjectionResult_2 =')
    expect(code).toMatchInlineSnapshot(`
      "import type { DocumentProjectionBase } from "groq";

      export declare const internalGroqTypeReferenceTo: unique symbol;

      export type Post = {
        _id: string;
        _type: "post";
        title?: string;
      };

      export type AllSanitySchemaTypes = Post;

      export type DefaultSchema = Post;

      // Source: projections.ts
      // Variable: projection
      // Projection: {_id}
      export type ProjectionResult = DocumentProjectionBase<{
        _id: string;
      }, "post">;

      // Source: projections.ts
      // Variable: projection
      // Projection: {title}
      export type ProjectionResult_2 = DocumentProjectionBase<{
        title: string | null;
      }, "post">;

      // Schema TypeMap
      declare module "groq" {
        interface SanitySchemas {
          "default": DefaultSchema;
        }
      }

      // Document Projection TypeMap
      declare module "groq" {
        interface SanityDocumentProjections {
          "{_id}": ProjectionResult;
          "{title}": ProjectionResult_2;
        }
      }

      "
    `)
  })
})
