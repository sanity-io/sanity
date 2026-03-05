import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {measureFpsForInput} from '../../helpers/measureFpsForInput'
import {defineEfpsTest} from '../../types'

export default defineEfpsTest({
  name: path.basename(fileURLToPath(import.meta.url), path.extname(fileURLToPath(import.meta.url))),
  configPath: import.meta.resolve?.('./sanity.config.ts'),
  document: {_type: 'arrayI18n'},
  run: async ({page}) => {
    await page.getByRole('button', {name: 'en'}).click()

    const result = await measureFpsForInput({
      page,
      fieldName: 'simple',
      label: 'simple-en',
    })

    return [result]
  },
})
