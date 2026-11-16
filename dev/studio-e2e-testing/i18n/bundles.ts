import {testStudioLocaleNamespace} from 'sanity-test-studio/locales'
import {defineLocaleResourceBundle} from 'sanity/i18n'

export const e2eI18nBundles = [
  defineLocaleResourceBundle({
    locale: 'en-US',
    namespace: testStudioLocaleNamespace,
    resources: {
      'field-groups.group-1': '🇺🇸 Group 1',
    },
  }),
]
