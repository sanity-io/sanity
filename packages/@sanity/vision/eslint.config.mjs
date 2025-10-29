import baseConfig from '@repo/eslint-config'
import i18nConfig from '@sanity/eslint-config-i18n'
import {defineConfig} from 'eslint/config'

export default defineConfig([...baseConfig, ...i18nConfig])
