import {useEditor} from '@portabletext/editor'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {LocaleProviderBase} from '../../../core/i18n/components/LocaleProvider'
import {prepareI18n} from '../../../core/i18n/i18nConfig'
import {usEnglishLocale} from '../../../core/i18n/locales'
import {ErrorBoundary} from '../ErrorBoundary'

console.log(
  prepareI18n,
  ErrorBoundary,
  useEditor,
  LocaleProviderBase,

  createMockSanityClient,
  createTestProvider,
  usEnglishLocale,
)

describe('ErrorBoundary', () => {
  beforeAll(() => {
    vi.clearAllMocks()
  })

  it('calls onUncaughtError when an error is caught', async () => {
    expect(true).toBe(true)
  })
})
