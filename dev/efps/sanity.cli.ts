import {apiConfig} from './apiConfig'
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: apiConfig,
  reactCompiler: {target: '19'},
})
