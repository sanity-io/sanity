import {type Decorator} from '@storybook/react-vite'
import {Suspense} from 'react'
import {I18nextProvider} from 'react-i18next'

import {i18next} from '../../lib/i18n'

/**
 * Wraps stories in the real Studio i18next instance (see lib/i18n.ts). The
 * provider makes the instance explicit; Suspense covers the brief window where
 * `useTranslation` suspends while the studio bundle finishes loading.
 */
export const withI18n: Decorator = (Story) => (
  <I18nextProvider i18n={i18next}>
    <Suspense fallback={null}>
      <Story />
    </Suspense>
  </I18nextProvider>
)
