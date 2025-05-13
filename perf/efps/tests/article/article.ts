import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {measureFpsForInput} from '../../helpers/measureFpsForInput'
import {measureFpsForPte} from '../../helpers/measureFpsForPte'
import {defineEfpsTest} from '../../types'
import document from './document'
import {author, categories} from './references'
import {type Author, type Category, type Hero} from './sanity.types'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const generateKey = () => {
  const rng = () =>
    Math.floor(Math.random() * 255)
      .toString(16)
      .padStart(2, '0')

  return Array.from({length: 6}, rng).join('')
}

export default defineEfpsTest({
  name: 'article',
  configPath: await import.meta.resolve?.('./sanity.config.ts'),
  document: async ({client}) => {
    const images = (await fs.promises.readdir(path.join(dirname, './assets'))).filter((name) =>
      name.endsWith('.webp'),
    )

    const imageAssets = await Promise.all(
      images
        .filter((name) => name.endsWith('.webp'))
        .map((imageName) =>
          client.assets.upload(
            'image',
            fs.createReadStream(path.join(dirname, './assets', imageName)),
            {
              source: {id: imageName, name: 'article-test'},
            },
          ),
        ),
    )
    const [asset1, asset2, asset3, asset4, asset5, asset6] = imageAssets

    const transaction = client.transaction()

    const authorWithImage: Omit<Author, '_createdAt' | '_updatedAt' | '_rev'> = {
      ...author,
      profilePicture: {
        _type: 'image',
        asset: {
          _ref: asset1._id,
          _type: 'reference',
        },
      },
    }
    transaction.createOrReplace(authorWithImage)

    for (const category of categories) {
      const categoryWithImage: Omit<Category, '_createdAt' | '_updatedAt' | '_rev'> = {
        ...category,
        image: {
          _type: 'image',
          asset: {
            _ref: asset2._id,
            _type: 'reference',
          },
        },
      }

      transaction.createOrReplace(categoryWithImage)
    }
    await transaction.commit()

    const createHero = (): Hero & {_key: string} => ({
      _key: generateKey(),
      _type: 'hero',
      image: {
        _type: 'image',
        asset: {_type: 'reference', _ref: asset5._id},
      },
      body: [
        {
          _key: generateKey(),
          _type: 'block',
          children: [{_key: generateKey(), _type: 'span', marks: [], text: 'Example text'}],
          markDefs: [],
          style: 'normal',
        },
      ],
    })

    document.mainImage = {
      _type: 'image',
      asset: {_ref: asset3._id, _type: 'reference'},
    }

    document.body?.splice(10, 0, {
      _type: 'image',
      _key: generateKey(),
      asset: {_type: 'reference', _ref: asset1._id},
    })
    document.body?.splice(15, 0, createHero())

    document.body?.splice(20, 0, {
      _type: 'image',
      _key: generateKey(),
      asset: {_type: 'reference', _ref: asset2._id},
    })
    document.body?.splice(25, 0, createHero())

    document.body?.splice(30, 0, {
      _type: 'image',
      _key: generateKey(),
      asset: {_type: 'reference', _ref: asset3._id},
    })
    document.body?.splice(35, 0, createHero())

    document.body?.splice(40, 0, {
      _type: 'image',
      _key: generateKey(),
      asset: {_type: 'reference', _ref: asset4._id},
    })
    document.body?.splice(45, 0, createHero())

    document.body?.splice(50, 0, {
      _type: 'image',
      _key: generateKey(),
      asset: {_type: 'reference', _ref: asset5._id},
    })
    document.body?.splice(55, 0, createHero())

    document.body?.splice(60, 0, {
      _type: 'image',
      _key: generateKey(),
      asset: {_type: 'reference', _ref: asset6._id},
    })
    document.body?.splice(65, 0, createHero())

    return document
  },
  run: async ({page}) => [
    // await measureFpsForInput({page, fieldName: 'title'}),
    await measureFpsForPte({page, fieldName: 'body'}),
    await measureFpsForInput({page, fieldName: 'seo.metaTitle', label: 'string inside object'}),
    await measureFpsForInput({page, fieldName: 'tags', label: 'string inside array'}),
  ],
})
