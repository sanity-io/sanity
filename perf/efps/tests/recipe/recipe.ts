import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {measureFpsForInput} from '../../helpers/measureFpsForInput'
import {measureFpsForPte} from '../../helpers/measureFpsForPte'
import {defineEfpsTest} from '../../types'
import {type Category, type Recipe} from './sanity.types'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const generateKey = () => {
  const rng = () =>
    Math.floor(Math.random() * 255)
      .toString(16)
      .padStart(2, '0')

  return Array.from({length: 6}, rng).join('')
}

export default defineEfpsTest({
  name: 'recipe',
  configPath: await import.meta.resolve?.('./sanity.config.ts'),
  document: async ({client}) => {
    const imageAsset = await client.assets.upload(
      'image',
      fs.createReadStream(path.join(dirname, 'assets', 'pizza.webp')),
      {
        source: {id: 'pizza', name: 'recipe-test'},
      },
    )

    const category: Omit<Category, '_rev' | '_updatedAt' | '_createdAt'> = {
      _id: 'example-recipe-category',
      _type: 'category',
      name: 'Italian',
      description:
        'Italian pizzas are known for their simple, high-quality ingredients and traditional preparation methods. The Margherita, with its fresh tomato sauce, mozzarella, and basil on a thin, crispy crust, is a classic representation of this beloved cuisine.',
    }

    await client.createOrReplace(category)

    const recipe: Omit<Recipe, '_id' | '_createdAt' | '_updatedAt' | '_rev'> = {
      _type: 'recipe',
      name: 'Classic Margherita Pizza',
      slug: {_type: 'slug', current: 'classic-margherita-pizza'},
      description: 'A simple yet delicious Neapolitan pizza with fresh ingredients.',
      difficulty: 'easy',
      image: {
        _type: 'image',
        asset: {_type: 'reference', _ref: imageAsset._id},
      },
      prepTime: 20,
      cookTime: 10,
      servings: 2,
      ingredients: [
        {_key: generateKey(), _type: 'ingredient', item: 'Pizza dough', amount: 250, unit: 'g'},
        {_key: generateKey(), _type: 'ingredient', item: 'Tomato sauce', amount: 80, unit: 'ml'},
        {
          _key: generateKey(),
          _type: 'ingredient',
          item: 'Fresh mozzarella',
          amount: 125,
          unit: 'g',
        },
        {
          _key: generateKey(),
          _type: 'ingredient',
          item: 'Fresh basil leaves',
          amount: 5,
          unit: 'leaves',
        },
        {
          _key: generateKey(),
          _type: 'ingredient',
          item: 'Extra virgin olive oil',
          amount: 1,
          unit: 'tbsp',
        },
      ],
      category: {
        _ref: category._id,
        _type: 'reference',
      },
      instructions: [
        {
          _type: 'block',
          _key: generateKey(),
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'Preheat your oven to 450°F (230°C) with a pizza stone or baking sheet inside.',
            },
          ],
          style: 'normal',
        },
        {
          _type: 'block',
          _key: generateKey(),
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'Roll out the pizza dough on a floured surface to about 12 inches in diameter.',
            },
          ],
          style: 'normal',
        },
        {
          _type: 'block',
          _key: generateKey(),
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'Spread the tomato sauce evenly over the dough, leaving a small border around the edges.',
            },
          ],
          style: 'normal',
        },
        {
          _type: 'block',
          _key: generateKey(),
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'Tear the mozzarella into small pieces and distribute evenly over the sauce.',
            },
          ],
          style: 'normal',
        },
        {
          _type: 'block',
          _key: generateKey(),
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'Carefully transfer the pizza to the preheated stone or baking sheet and bake for 8-10 minutes, or until the crust is golden and the cheese is bubbly.',
            },
          ],
          style: 'normal',
        },
        {
          _type: 'block',
          _key: generateKey(),
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'Remove from the oven, drizzle with olive oil, and top with fresh basil leaves. Slice and serve immediately.',
            },
          ],
          style: 'normal',
        },
      ],
    }

    return recipe
  },
  run: async ({page}) => {
    return [
      {
        label: 'name',
        ...(await measureFpsForInput(
          page.locator('[data-testid="field-name"] input[type="text"]'),
        )),
      },
      {
        label: 'description',
        ...(await measureFpsForInput(page.locator('[data-testid="field-description"] textarea'))),
      },
      {
        label: 'instructions',
        ...(await measureFpsForPte(page.locator('[data-testid="field-instructions"]'))),
      },
    ]
  },
})
