import {type BenchDocument} from '../mock-api/types'
import {createFixtureRng, keyGenerator, wordPicker} from './fixtures/prng'
import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-wrapped-form'

function buildWrappedForm(): BenchDocument[] {
  const rng = createFixtureRng(20010911)
  const nextKey = keyGenerator(rng)
  const word = wordPicker(rng)
  return [
    {
      _id: `drafts.${DOCUMENT_ID}`,
      _type: 'wrappedForm',
      title: `${word()} ${word()}`,
      description: Array.from({length: 12}, () => word()).join(' '),
      tags: Array.from({length: 4}, () => ({
        _key: nextKey(),
        _type: 'object',
        label: word(),
      })),
      body: Array.from({length: 3}, () => ({
        _type: 'block',
        _key: nextKey(),
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: nextKey(),
            text: Array.from({length: 10}, () => word()).join(' '),
          },
        ],
      })),
    },
  ]
}

/**
 * Every form.components slot wrapped at the config level
 * (studio/schemas/wrappedForm.tsx) — typing and settling both happen through
 * the customization wrappers. Requires the customization build.
 */
export const wrappedForm = defineScenario({
  name: 'wrappedForm',
  sourceFile: 'perf/bench/scenarios/wrappedForm.ts',
  workspace: 'wrappedForm',
  requiresCustomizations: true,
  documentType: 'wrappedForm',
  documentId: DOCUMENT_ID,
  fixture: buildWrappedForm,
  interactions: [
    {fieldPath: 'title', kind: 'string'},
    {fieldPath: 'description', kind: 'string'},
  ],
})
