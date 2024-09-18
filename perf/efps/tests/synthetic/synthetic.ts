import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {measureFpsForInput} from '../../helpers/measureFpsForInput'
import {defineEfpsTest} from '../../types'
import {type Synthetic, type SyntheticObject} from './sanity.types'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const generateKey = () => {
  const rng = () =>
    Math.floor(Math.random() * 255)
      .toString(16)
      .padStart(2, '0')

  return Array.from({length: 6}, rng).join('')
}

const getRandomWords = () => {
  const words = [
    'whisper',
    'kaleidoscope',
    'tundra',
    'labyrinth',
    'quasar',
    'ember',
    'flux',
    'verdant',
    'obsidian',
    'ripple',
    'zephyr',
    'nebula',
    'lattice',
    'prism',
    'cascade',
    'fable',
    'twilight',
    'echo',
    'thistle',
  ]

  // Generate a random number of words to combine (between 2 and 5)
  const numberOfWords = Math.floor(Math.random() * 4) + 2

  // Shuffle the words array and take the first 'numberOfWords' elements
  const randomWords = words.sort(() => 0.5 - Math.random()).slice(0, numberOfWords)

  // Join the words with a space in between
  return randomWords.join(' ')
}

export default defineEfpsTest({
  name: 'synthetic',
  configPath: await import.meta.resolve?.('./sanity.config.ts'),
  document: async ({client}) => {
    const imageAsset = await client.assets.upload(
      'image',
      fs.createReadStream(path.join(dirname, 'assets', 'image.webp')),
      {source: {id: 'image', name: 'synthetic-test'}},
    )
    const fileAsset = await client.assets.upload(
      'file',
      fs.createReadStream(path.join(dirname, 'assets', 'file.txt')),
      {
        source: {id: 'file', name: 'synthetic-test'},
        contentType: 'text/plain',
        filename: 'file.txt',
      },
    )

    const reference = await client.createOrReplace({
      _id: 'synthetic-reference',
      _type: 'synthetic',
      title: 'reference document',
    })

    const generateObject = (): SyntheticObject & {_key: string} => ({
      _key: generateKey(),
      _type: 'syntheticObject',
      boolean: false,
      date: new Date().toLocaleDateString('en-CA'),
      datetime: new Date().toISOString(),
      image: {_type: 'image', asset: {_ref: imageAsset._id, _type: 'reference'}},
      file: {_type: 'file', asset: {_ref: fileAsset._id, _type: 'reference'}},
      reference: {_ref: reference._id, _type: 'reference'},
      geopoint: {_type: 'geopoint', lat: 41.8781, lng: 87.6298},
      name: 'an object',
      number: 5,
      string: 'a string',
      text:
        'In the stillness of the early morning, when the world is just ' +
        'beginning to stir, there is a quiet magic that blankets everything. ' +
        'The first rays of sunlight pierce through the horizon, casting a ' +
        'golden glow across the landscape. The air is crisp and cool, ' +
        'carrying with it the faint scent of dew-kissed grass and blooming ' +
        'flowers. Birds begin their morning songs, a chorus that welcomes ' +
        'the new day with hope and promise. In these moments, time seems to ' +
        'pause, allowing you to soak in the serenity and beauty of a world ' +
        'waking up, reminding you of the simple yet profound joys of life.',
      ...Object.fromEntries(
        Array.from({length: 20}).map((_, i) => [`field${i}`, getRandomWords()]),
      ),
    })

    const synthetic: Omit<Synthetic, '_id' | '_createdAt' | '_updatedAt' | '_rev'> = {
      _type: 'synthetic',
      arrayOfObjects: Array.from({length: 100}, generateObject),
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
    }

    return synthetic
  },
  run: async ({page}) => {
    return [
      {
        label: 'title',
        ...(await measureFpsForInput(
          page.locator('[data-testid="field-title"] input[type="text"]'),
        )),
      },
      {
        label: 'string in object',
        ...(await measureFpsForInput(
          page.locator('[data-testid="field-syntheticObject.name"] input[type="text"]'),
        )),
      },
    ]
  },
})
