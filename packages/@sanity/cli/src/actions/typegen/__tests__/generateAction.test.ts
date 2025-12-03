import {type EventEmitter} from 'node:events'
import {mkdir, writeFile} from 'node:fs/promises'
import {Worker} from 'node:worker_threads'

import type * as SanityCodegen from '@sanity/codegen'
import {
  type ExtractedModule,
  type GenerateTypesOptions,
  QueryExtractionError,
  readConfig,
  TypeGenerator,
} from '@sanity/codegen'
import {WorkerChannelReporter} from '@sanity/worker-channels'
import {type Ora} from 'ora'
import {expect, test, vi} from 'vitest'

import {type CliCommandArguments, type CliCommandContext, type CliOutputter} from '../../../types'
import {type TypegenWorkerChannel} from '../../../workers/typegenGenerate'
import {TypesGeneratedTrace} from '../generate.telemetry'
import generateAction, {type TypegenGenerateTypesCommandFlags} from '../generateAction'

vi.mock('@sanity/codegen', async (importOriginal) => {
  const original = await importOriginal<typeof SanityCodegen>()
  return {...original, readConfig: vi.fn()}
})

vi.mock('node:worker_threads', async () => {
  const {EventEmitter} = await import('node:events')
  function MockWorker(this: EventEmitter) {
    EventEmitter.call(this)
  }
  MockWorker.prototype = Object.create(EventEmitter.prototype)
  MockWorker.prototype.constructor = MockWorker
  MockWorker.prototype.terminate = vi.fn()
  return {Worker: vi.fn(MockWorker)}
})

vi.mock('../../../util/cliWorker', () => ({
  getCliWorkerPath: vi.fn().mockReturnValue('./worker-path.js'),
}))

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn().mockResolvedValue({
    isFile: () => true,
  }),
}))

const oraHandler = vi.fn<(message: string) => Ora>(() => ora)
const ora = {
  start: (message: string) => oraHandler(`  ${message}`),
  succeed: (message: string) => oraHandler(`✓ ${message}`),
  fail: (message: string) => oraHandler(`× ${message}`),
  warn: (message: string) => oraHandler(`⚠ ${message}`),
  // eslint-disable-next-line accessor-pairs
  set text(message: string) {
    oraHandler(`  ${message}`)
  },
} as Ora
const spinner = vi.fn().mockReturnValue(ora) as CliOutputter['spinner']

const trace = {
  start: vi.fn(),
  log: vi.fn(),
  complete: vi.fn(),
  error: vi.fn(),
}
const telemetry = {
  trace: vi.fn().mockReturnValue(trace),
  updateUserProperties: vi.fn(),
  log: vi.fn(),
} as CliCommandContext['telemetry']

test(generateAction.name, async () => {
  const workDir = '/work-dir'
  const schemaPath = './schema.json'
  const overloadClientMethods = true
  const configPath = './custom-sanity-typegen.json'
  const generates = './custom-output-folder/sanity.types.ts'

  vi.mocked(readConfig).mockResolvedValue({
    generates,
    schema: schemaPath,
    overloadClientMethods,
    formatGeneratedCode: true,
    path: './src/**/*.{ts,js}',
  })

  const complete = generateAction(
    {
      extOptions: {'config-path': configPath},
    } as CliCommandArguments<TypegenGenerateTypesCommandFlags>,
    {
      output: {spinner: spinner},
      workDir,
      telemetry,
    } as CliCommandContext,
  )

  const worker = await new Promise<Worker>((resolve) => {
    const id = setInterval(() => {
      const [instance] = vi.mocked(Worker).mock.instances
      if (!instance) return
      clearInterval(id)
      resolve(instance)
    }, 0)
  })
  const report = WorkerChannelReporter.from<TypegenWorkerChannel>(worker)

  const schema: GenerateTypesOptions['schema'] = [
    {
      type: 'document',
      name: 'post',
      attributes: {
        _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
        title: {type: 'objectAttribute', value: {type: 'string'}},
        views: {type: 'objectAttribute', value: {type: 'number'}},
      },
    },
    {
      type: 'type',
      name: 'author',
      value: {
        type: 'object',
        attributes: {
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'author'}},
          name: {type: 'objectAttribute', value: {type: 'string'}},
        },
      },
    },
  ]
  report.event.loadedSchema()

  const extractedModules: ExtractedModule[] = [
    {filename: '/work-dir/src/no-queries-in-file.ts', queries: [], errors: []},
    {
      filename: '/work-dir/src/queries.ts',
      queries: [
        {
          variable: {id: {type: 'Identifier', name: 'postTitles'}},
          query: '*[_type == "post"]{title}',
          filename: '/work-dir/src/queries.ts',
        },
        {
          variable: {id: {type: 'Identifier', name: 'firstPost'}},
          query: '*[_type == "post"][0]{title, views}',
          filename: '/work-dir/src/queries.ts',
        },
      ],
      errors: [],
    },
    {
      filename: '/work-dir/src/has-errors.ts',
      queries: [],
      errors: [
        new QueryExtractionError({
          cause: new Error('Test error'),
          filename: '/work-dir/src/has-errors.ts',
        }),
      ],
    },
  ]
  async function* getQueries(): AsyncGenerator<ExtractedModule> {
    for (const item of extractedModules) {
      yield item
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  const typeGenerator = new TypeGenerator()
  report.event.typegenStarted({expectedFileCount: extractedModules.length})

  const result = await typeGenerator.generateTypes({
    root: workDir,
    reporter: report,
    schema,
    queries: getQueries(),
    overloadClientMethods,
    schemaPath,
  })
  report.event.typegenComplete(result)

  await complete
  const logs = oraHandler.mock.calls.map(([message]) => message).join('\n')

  expect(logs).toMatchInlineSnapshot(`
    "  Loading config…
    ✓ Config loaded from ./custom-sanity-typegen.json
      Loading schema…
    ✓ Schema loaded from ./schema.json
      Generating schema types…
    ✓ Generated 2 schema types
      Generating query types…
      Generating query types… (33.3%)
      └─ Processed 1 of 3 files. Found 0 queries from 0 files.
      Generating query types… (66.7%)
      └─ Processed 2 of 3 files. Found 2 queries from 1 file.
    × Error while extracting query in /work-dir/src/has-errors.ts: Test error
      Generating query types… (100.0%)
      └─ Processed 3 of 3 files. Found 2 queries from 1 file.
    ✓ Generated 2 query types from 1 file out of 3 scanned files
      Formatting generated types with prettier…
    ✓ Formatted generated types with prettier
    ⚠ Encountered errors in 1 file while generating types
    ✓ Successfully generated types to ./custom-output-folder/sanity.types.ts"
  `)

  expect(mkdir).toHaveBeenCalledWith('/work-dir/custom-output-folder', {recursive: true})
  expect(writeFile).toHaveBeenCalledTimes(2)
  const [unformatted, formatted] = vi.mocked(writeFile).mock.calls

  expect(unformatted).toMatchInlineSnapshot(`
    [
      "/work-dir/custom-output-folder/sanity.types.ts",
      "/**
     * ---------------------------------------------------------------------------------
     * This file has been generated by Sanity TypeGen.
     * Command: \`sanity typegen generate\`
     *
     * Any modifications made directly to this file will be overwritten the next time
     * the TypeScript definitions are generated. Please make changes to the Sanity
     * schema definitions and/or GROQ queries if you need to update these types.
     *
     * For more information on how to use Sanity TypeGen, visit the official documentation:
     * https://www.sanity.io/docs/sanity-typegen
     * ---------------------------------------------------------------------------------
     */

    // Source: schema.json
    export type Post = {
      _type: "post";
      title: string;
      views: number;
    };

    export type Author = {
      _type: "author";
      name: string;
    };

    export type AllSanitySchemaTypes = Post | Author;

    export declare const internalGroqTypeReferenceTo: unique symbol;

    // Source: src/queries.ts
    // Variable: postTitles
    // Query: *[_type == "post"]{title}
    export type PostTitlesResult = Array<{
      title: string;
    }>;

    // Source: src/queries.ts
    // Variable: firstPost
    // Query: *[_type == "post"][0]{title, views}
    export type FirstPostResult = {
      title: string;
      views: number;
    } | null;

    // Query TypeMap
    import "@sanity/client";
    declare module "@sanity/client" {
      interface SanityQueries {
        "*[_type == \\"post\\"]{title}": PostTitlesResult;
        "*[_type == \\"post\\"][0]{title, views}": FirstPostResult;
      }
    }

    ",
    ]
  `)

  expect(formatted).toMatchInlineSnapshot(`
    [
      "/work-dir/custom-output-folder/sanity.types.ts",
      "/**
     * ---------------------------------------------------------------------------------
     * This file has been generated by Sanity TypeGen.
     * Command: \`sanity typegen generate\`
     *
     * Any modifications made directly to this file will be overwritten the next time
     * the TypeScript definitions are generated. Please make changes to the Sanity
     * schema definitions and/or GROQ queries if you need to update these types.
     *
     * For more information on how to use Sanity TypeGen, visit the official documentation:
     * https://www.sanity.io/docs/sanity-typegen
     * ---------------------------------------------------------------------------------
     */

    // Source: schema.json
    export type Post = {
      _type: "post";
      title: string;
      views: number;
    };

    export type Author = {
      _type: "author";
      name: string;
    };

    export type AllSanitySchemaTypes = Post | Author;

    export declare const internalGroqTypeReferenceTo: unique symbol;

    // Source: src/queries.ts
    // Variable: postTitles
    // Query: *[_type == "post"]{title}
    export type PostTitlesResult = Array<{
      title: string;
    }>;

    // Source: src/queries.ts
    // Variable: firstPost
    // Query: *[_type == "post"][0]{title, views}
    export type FirstPostResult = {
      title: string;
      views: number;
    } | null;

    // Query TypeMap
    import "@sanity/client";
    declare module "@sanity/client" {
      interface SanityQueries {
        '*[_type == "post"]{title}': PostTitlesResult;
        '*[_type == "post"][0]{title, views}': FirstPostResult;
      }
    }
    ",
    ]
  `)

  expect(telemetry.trace).toHaveBeenCalledWith(TypesGeneratedTrace)
  expect(trace.start).toHaveBeenCalledTimes(1)
  expect(trace.complete).toHaveBeenCalledTimes(1)
  expect(trace.error).not.toHaveBeenCalled()
  expect(trace.log.mock.lastCall).toMatchInlineSnapshot(`
    [
      {
        "configMethod": "legacy",
        "configOverloadClientMethods": true,
        "emptyUnionTypeNodesGenerated": 0,
        "filesWithErrors": 1,
        "outputSize": 823,
        "queriesCount": 2,
        "queryFilesCount": 1,
        "schemaTypesCount": 2,
        "typeNodesGenerated": 8,
        "unknownTypeNodesGenerated": 0,
        "unknownTypeNodesRatio": 0,
      },
    ]
  `)
})
