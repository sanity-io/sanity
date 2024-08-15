import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {measureFpsForPte} from '../../helpers/measureFpsForPte'
import {defineEfpsTest} from '../../types'
import document from './document'

export default defineEfpsTest({
  name: path.basename(fileURLToPath(import.meta.url), path.extname(fileURLToPath(import.meta.url))),
  configPath: await import.meta.resolve?.('./sanity.config.ts'),
  document: async ({client}) => {
    const imagePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sanity_logo.png')
    const image = await client.assets.upload('image', fs.createReadStream(imagePath), {
      source: {id: 'longProseTest', name: 'sanity_logo'},
    })

    const imageBlock = {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: image._id,
      },
    }

    const objectBlock = {
      _type: 'exampleObject',
      foo: 'foo',
      bar: 'bar',
    }

    const generateKey = () => {
      const rng = () =>
        Math.floor(Math.random() * 255)
          .toString(16)
          .padStart(2, '0')

      return Array.from({length: 6}, rng).join('')
    }

    const longProse = document.longProse.flatMap((block) => [
      block,
      {...imageBlock, _key: generateKey()},
      {...objectBlock, _key: generateKey()},
    ])

    return {...document, longProse}
  },
  run: async ({page}) => {
    const input = page.locator('[data-testid="field-longProse"]')
    const result = await measureFpsForPte(input)
    return result
  },
})
