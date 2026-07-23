// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineCliConfig} from 'sanity/cli'

import {apiConfig} from './apiConfig'

export default defineCliConfig({
  api: apiConfig,
  reactCompiler: {target: '19'},
})
