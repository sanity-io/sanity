import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {measureFpsForInput} from '../../helpers/measureFpsForInput'
import {defineEfpsTest} from '../../types'

// copy pasta from article.ts
const generateKey = () => {
  const rng = () =>
    Math.floor(Math.random() * 255)
      .toString(16)
      .padStart(2, '0')

  return Array.from({length: 6}, rng).join('')
}

export default defineEfpsTest({
  name: path.basename(fileURLToPath(import.meta.url), path.extname(fileURLToPath(import.meta.url))),
  configPath: import.meta.resolve?.('./sanity.config.ts'),
  document: {
    _type: 'arrayI18n',
    simple: [
      {
        _type: 'internationalizedArrayStringValue',
        _key: generateKey(),
        language: 'en',
        value: 'hello world',
      },
    ],
  },
  run: async ({page}) => {
    const result = await measureFpsForInput({
      page,
      fieldName: 'simple',
      label: 'simple-en',
    })

    return [result]
  },
})
