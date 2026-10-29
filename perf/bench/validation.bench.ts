import {type SanityDocument} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {validateDocuments} from '@sanity/validation'
import {inferFromSchema} from '@sanity/validation/_internal'
import {test} from 'vitest'

import {article} from './scenarios/article'
import {synthetic, syntheticLarge} from './scenarios/synthetic'
import {articleSchemaTypes} from './studio/schemas/articleSchemaTypes'
import {syntheticSchemaTypes} from './studio/schemas/syntheticSchemaTypes'

for (const [scenario, schemaTypes, documentCount] of [
  [article, articleSchemaTypes, 1],
  [synthetic, syntheticSchemaTypes, 1],
  [syntheticLarge, syntheticSchemaTypes, 1],
  [synthetic, syntheticSchemaTypes, 13],
] as const) {
  const name = documentCount === 1 ? scenario.name : `${scenario.name}-batch`
  test(name, {timeout: 60_000}, async ({bench}) => {
    const parent = SchemaBuilder.compile({name: 'builtins', types: builtinTypes})
    inferFromSchema(parent)
    const schema = SchemaBuilder.compile({
      name: scenario.name,
      parent,
      types: schemaTypes,
    })
    inferFromSchema(schema)
    const fixtures = scenario.fixture?.() ?? []
    const document = fixtures.find((fixture) => fixture._id === `drafts.${scenario.documentId}`)
    if (!document) throw new Error(`Missing benchmark document for ${scenario.name}`)
    const documents: SanityDocument[] = Array.from({length: documentCount}, (_, index) => ({
      ...document,
      _id: `${document._id}-${index}`,
      _rev: 'revision',
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
    }))
    const getDocumentExists = async ({id}: {id: string}) =>
      fixtures.some((fixture) => fixture._id === id)

    await bench('validateDocuments', {writeResult: `.vitest/benchmarks/${name}.json`}, async () => {
      const results = await validateDocuments({
        schema,
        documents,
        // Measure CPU work: references use fixtures; client-dependent checks are skipped.
        customValidation: false,
        getDocumentExists,
      })
      if (results.some((result) => result.markers.length > 0)) {
        throw new Error(`Expected valid benchmark documents: ${JSON.stringify(results)}`)
      }
    }).run({time: 1_000, iterations: 5, warmupTime: 200, warmupIterations: 1})
  })
}
