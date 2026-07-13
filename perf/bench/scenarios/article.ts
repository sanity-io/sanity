import {EXPERIMENT} from '../constants'
import {type BenchDocument} from '../mock-api/types'
import articleDocument from './fixtures/articleDocument'
import {imageAsset, imageRef} from './fixtures/assets'
import {createFixtureRng, keyGenerator} from './fixtures/prng'
import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-article'

/** Extract all span text from a Portable Text array (readback for PTE). */
export function portableText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((block) =>
      block?._type === 'block' && Array.isArray(block.children)
        ? block.children.map((child: {text?: string}) => child.text ?? '').join('')
        : '',
    )
    .join('')
}

function buildArticle(): BenchDocument[] {
  const rng = createFixtureRng(20260706)
  const nextKey = keyGenerator(rng)

  // Deep-clone the static body so splices never mutate the module-level
  // fixture (the old suite mutated a shared document object across runs)
  const article = structuredClone(articleDocument) as unknown as BenchDocument
  const body = article.body as Record<string, unknown>[]

  const createHero = () => ({
    _key: nextKey(),
    _type: 'hero',
    image: imageRef('hero'),
    body: [
      {
        _key: nextKey(),
        _type: 'block',
        children: [{_key: nextKey(), _type: 'span', marks: [], text: 'Example text'}],
        markDefs: [],
        style: 'normal',
      },
    ],
  })
  const createImage = (name: string) => ({...imageRef(name), _key: nextKey()})

  // Same interleaving as dev/efps/tests/article/article.ts
  body.splice(10, 0, createImage('one'))
  body.splice(15, 0, createHero())
  body.splice(20, 0, createImage('two'))
  body.splice(25, 0, createHero())
  body.splice(30, 0, createImage('three'))
  body.splice(35, 0, createHero())
  body.splice(40, 0, createImage('four'))
  body.splice(45, 0, createHero())
  body.splice(50, 0, createImage('five'))
  body.splice(55, 0, createHero())
  body.splice(60, 0, createImage('six'))
  body.splice(65, 0, createHero())

  article.mainImage = imageRef('main')
  article._id = `drafts.${DOCUMENT_ID}`

  const author: BenchDocument = {
    _id: 'reference-author',
    _type: 'author',
    name: 'Sarah Mitchell',
    profilePicture: imageRef('author'),
    bio: [
      {
        _key: 'c4a812b3f609',
        _type: 'block',
        children: [
          {
            _key: 'a9f3d67b8c12',
            _type: 'span',
            text: 'Sarah Mitchell is a seasoned writer and remote work advocate.',
          },
        ],
      },
    ],
  }
  const categories: BenchDocument[] = [
    {_id: 'category-0', _type: 'category', name: 'Future of Work', image: imageRef('category')},
    {_id: 'category-1', _type: 'category', name: 'Mental Health', image: imageRef('category')},
  ]

  return [
    article,
    author,
    ...categories,
    ...['main', 'hero', 'author', 'category', 'one', 'two', 'three', 'four', 'five', 'six'].map(
      (name) => imageAsset(name, EXPERIMENT.projectId),
    ),
  ]
}

// Ported from dev/efps/tests/article/article.ts
export const article = defineScenario({
  name: 'article',
  documentType: 'article',
  documentId: DOCUMENT_ID,
  fixture: buildArticle,
  interactions: [
    {fieldPath: 'title', kind: 'string'},
    {
      fieldPath: 'body',
      kind: 'pte',
      readbackText: (doc: BenchDocument) => portableText(doc.body),
    },
    {
      fieldPath: 'seo.metaTitle',
      kind: 'string',
      label: 'string inside object',
    },
    {
      fieldPath: 'tags',
      kind: 'string',
      label: 'string inside array',
      readbackText: (doc: BenchDocument) => ((doc.tags as string[] | undefined) ?? []).join(' '),
    },
  ],
})
