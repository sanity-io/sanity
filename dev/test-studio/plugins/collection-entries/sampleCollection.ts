import {randomKey} from '@sanity/util/content'
import {uuid} from '@sanity/uuid'

import {COLLECTION_ENTRIES_ID_PREFIX, COLLECTION_TYPE, ENTRY_TYPE} from './constants'

interface SampleParagraph {
  lead?: string
  text: string
}

interface SampleEntry {
  title: string
  paragraphs: SampleParagraph[]
}

const SAMPLE_COLLECTION_TITLE = 'Field guide to the garden'

const SAMPLE_ENTRIES: SampleEntry[] = [
  {
    title: 'Planning a vegetable bed',
    paragraphs: [
      {
        text: 'Pick a spot that gets at least six hours of direct sun and drains well after rain.',
      },
      {
        lead: 'Tip:',
        text: 'Keep the bed narrow enough to reach the middle without stepping on the soil.',
      },
    ],
  },
  {
    title: 'Watering through the summer',
    paragraphs: [
      {
        text: 'Water deeply and less often, so roots grow down to where the soil stays cool.',
      },
      {
        lead: 'Tip:',
        text: 'Early morning watering loses less to evaporation than watering at midday.',
      },
    ],
  },
  {
    title: 'Saving seeds for next year',
    paragraphs: [
      {
        text: 'Let a few of the healthiest plants go to seed, then dry the seeds fully before storing them.',
      },
      {
        lead: 'Tip:',
        text: 'Label each envelope with the variety and the date you collected it.',
      },
    ],
  },
]

function toSpan(text: string, marks: string[]) {
  return {_type: 'span', _key: randomKey(12), text, marks}
}

function toBlock(paragraph: SampleParagraph) {
  const leadSpans = paragraph.lead ? [toSpan(`${paragraph.lead} `, ['strong'])] : []
  return {
    _type: 'block',
    _key: randomKey(12),
    style: 'normal',
    markDefs: [],
    children: [...leadSpans, toSpan(paragraph.text, [])],
  }
}

// Fresh ids every run, so seeding never overwrites a sample someone is still editing in the shared dataset.
export function buildSampleCollection() {
  const suffix = uuid().slice(0, 8)

  const entries = SAMPLE_ENTRIES.map((sample, index) => ({
    _id: `${COLLECTION_ENTRIES_ID_PREFIX}entry-${suffix}-${index + 1}`,
    _type: ENTRY_TYPE,
    title: sample.title,
    body: sample.paragraphs.map(toBlock),
  }))

  const collection = {
    _id: `${COLLECTION_ENTRIES_ID_PREFIX}collection-${suffix}`,
    _type: COLLECTION_TYPE,
    title: SAMPLE_COLLECTION_TITLE,
    entries: entries.map((entry) => ({
      _key: randomKey(12),
      _type: 'reference',
      _ref: entry._id,
      _weak: true,
    })),
  }

  return {collection, entries}
}
