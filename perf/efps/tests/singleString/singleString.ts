import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {measureFpsForInput} from '../../helpers/measureFpsForInput'
import {defineEfpsTest} from '../../types'

export default defineEfpsTest({
  name: path.basename(fileURLToPath(import.meta.url), path.extname(fileURLToPath(import.meta.url))),
  configPath: await import.meta.resolve?.('./sanity.config.ts'),
  document: {_type: 'singleString'},
  run: async ({page}) => {
    const input = page.locator('[data-testid="field-stringField"] input[type="text"]')
    const result = await measureFpsForInput(input)
    return result
  },
})
