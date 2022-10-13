import {defineConfig} from '@sanity/pkg-utils'
import baseConfig from '../../../package.config'

export default defineConfig({...baseConfig, external: (external) => [...external, 'sanity']})
