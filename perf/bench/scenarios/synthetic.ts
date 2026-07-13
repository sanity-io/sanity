import {EXPERIMENT} from '../constants'
import {type BenchDocument} from '../mock-api/types'
import {fileAsset, fileRef, imageAsset, imageRef} from './fixtures/assets'
import {createFixtureRng, keyGenerator, wordPicker} from './fixtures/prng'
import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-synthetic'
const LARGE_DOCUMENT_ID = 'bench-synthetic-large'

// Fixed timestamps — fixtures must not read the wall clock
const FIXED_DATE = '2026-01-01'
const FIXED_DATETIME = '2026-01-01T12:00:00.000Z'

function buildSynthetic(documentId: string, arrayLength: number): BenchDocument[] {
  const rng = createFixtureRng(42)
  const nextKey = keyGenerator(rng)
  const randomWords = wordPicker(rng)

  const generateObject = (): Record<string, unknown> => ({
    _key: nextKey(),
    _type: 'syntheticObject',
    boolean: false,
    date: FIXED_DATE,
    datetime: FIXED_DATETIME,
    image: imageRef('synthetic'),
    file: fileRef('synthetic'),
    reference: {_ref: 'synthetic-reference', _type: 'reference'},
    geopoint: {_type: 'geopoint', lat: 41.8781, lng: 87.6298},
    name: 'an object',
    number: 5,
    string: 'a string',
    text:
      'In the stillness of the early morning, when the world is just ' +
      'beginning to stir, there is a quiet magic that blankets everything. ' +
      'The first rays of sunlight pierce through the horizon, casting a ' +
      'golden glow across the landscape.',
    ...Object.fromEntries(Array.from({length: 20}).map((_, i) => [`field${i}`, randomWords()])),
  })

  return [
    {
      _id: `drafts.${documentId}`,
      _type: 'synthetic',
      title: '',
      arrayOfObjects: Array.from({length: arrayLength}, generateObject),
      syntheticObject: {
        ...generateObject(),
        nestedObject: {
          ...generateObject(),
          nestedObject: {
            ...generateObject(),
            nestedObject: generateObject(),
          },
        },
      },
    },
    {_id: 'synthetic-reference', _type: 'synthetic', title: 'reference document'},
    imageAsset('synthetic', EXPERIMENT.projectId),
    fileAsset('synthetic', EXPERIMENT.projectId),
  ]
}

// Ported from dev/efps/tests/synthetic/synthetic.ts (100 array items)
export const synthetic = defineScenario({
  name: 'synthetic',
  documentType: 'synthetic',
  documentId: DOCUMENT_ID,
  fixture: () => buildSynthetic(DOCUMENT_ID, 100),
  interactions: [
    {fieldPath: 'title', kind: 'string'},
    {fieldPath: 'syntheticObject.name', kind: 'string', label: 'string inside object'},
  ],
})

/**
 * Document-scale variant (~5x synthetic): primarily the pageLoad
 * open-large-document scenario; typing into the title doubles as a
 * huge-document stress interaction.
 */
export const syntheticLarge = defineScenario({
  name: 'syntheticLarge',
  workspace: 'synthetic',
  documentType: 'synthetic',
  documentId: LARGE_DOCUMENT_ID,
  fixture: () => buildSynthetic(LARGE_DOCUMENT_ID, 500),
  interactions: [{fieldPath: 'title', kind: 'string'}],
})
