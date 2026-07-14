import {EXPERIMENT} from '../constants'
import {type BenchDocument} from '../mock-api/types'
import {portableText} from './article'
import {imageAsset, imageRef} from './fixtures/assets'
import {createFixtureRng, keyGenerator} from './fixtures/prng'
import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-recipe'

const INSTRUCTIONS = [
  'Preheat your oven to 450°F (230°C) with a pizza stone or baking sheet inside.',
  'Roll out the pizza dough on a floured surface to about 12 inches in diameter.',
  'Spread the tomato sauce evenly over the dough, leaving a small border around the edges.',
  'Tear the mozzarella into pieces and distribute over the sauce.',
  'Slide the pizza onto the hot stone and bake for 8-10 minutes until the crust is golden.',
  'Top with fresh basil leaves and a drizzle of olive oil before serving.',
]

function buildRecipe(): BenchDocument[] {
  const rng = createFixtureRng(19700101)
  const nextKey = keyGenerator(rng)

  const ingredient = (item: string, amount: number, unit: string) => ({
    _key: nextKey(),
    _type: 'ingredient',
    item,
    amount,
    unit,
  })

  return [
    {
      _id: `drafts.${DOCUMENT_ID}`,
      _type: 'recipe',
      name: 'Classic Margherita Pizza',
      slug: {_type: 'slug', current: 'classic-margherita-pizza'},
      description: 'A simple yet delicious Neapolitan pizza with fresh ingredients.',
      difficulty: 'easy',
      image: imageRef('pizza'),
      prepTime: 20,
      cookTime: 10,
      servings: 2,
      ingredients: [
        ingredient('Pizza dough', 250, 'g'),
        ingredient('Tomato sauce', 80, 'ml'),
        ingredient('Fresh mozzarella', 125, 'g'),
        ingredient('Fresh basil leaves', 5, 'leaves'),
        ingredient('Extra virgin olive oil', 1, 'tbsp'),
      ],
      category: {_type: 'reference', _ref: 'example-recipe-category'},
      instructions: INSTRUCTIONS.map((text) => ({
        _type: 'block',
        _key: nextKey(),
        children: [{_type: 'span', _key: nextKey(), text}],
        style: 'normal',
      })),
    },
    {
      _id: 'example-recipe-category',
      _type: 'category',
      name: 'Italian',
      description:
        'Italian pizzas are known for their simple, high-quality ingredients and traditional preparation methods.',
    },
    imageAsset('pizza', EXPERIMENT.projectId),
  ]
}

// Ported from dev/efps/tests/recipe/recipe.ts
export const recipe = defineScenario({
  name: 'recipe',
  sourceFile: 'perf/bench/scenarios/recipe.ts',
  documentType: 'recipe',
  documentId: DOCUMENT_ID,
  fixture: buildRecipe,
  interactions: [
    {fieldPath: 'name', kind: 'string'},
    {fieldPath: 'description', kind: 'string'},
    {
      fieldPath: 'instructions',
      kind: 'pte',
      readbackText: (doc: BenchDocument) => portableText(doc.instructions),
    },
  ],
})
