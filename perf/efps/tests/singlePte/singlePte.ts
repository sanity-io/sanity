import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {measureFpsForPte} from '../../helpers/measureFpsForPte'
import {defineEfpsTest} from '../../types'

export default defineEfpsTest({
  name: path.basename(fileURLToPath(import.meta.url), path.extname(fileURLToPath(import.meta.url))),
  document: {_type: 'singlePte'},
  configPath: await import.meta.resolve?.('./sanity.config.ts'),
  run: async ({page}) => {
    const input = page.locator('[data-testid="field-pteField"]')
    return await measureFpsForPte(input)
  },
})
