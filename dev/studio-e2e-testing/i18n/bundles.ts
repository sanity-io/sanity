// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineLocaleResourceBundle} from 'sanity'
import {testStudioLocaleNamespace} from 'sanity-test-studio/locales'

export const e2eI18nBundles = [
  defineLocaleResourceBundle({
    locale: 'en-US',
    namespace: testStudioLocaleNamespace,
    resources: {
      'field-groups.group-1': '🇺🇸 Group 1',
    },
  }),
]
