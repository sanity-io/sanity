import {Root} from '@sanity/ui'
import {render} from '@testing-library/react'
import {type SanityClient} from 'sanity'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {LocaleProviderBase, usEnglishLocale} from '../../../core/i18n'
import {prepareI18n} from '../../../core/i18n/i18nConfig'
import {ErrorBoundary} from '../ErrorBoundary'

describe('ErrorBoundary', () => {
  beforeAll(() => {
    vi.clearAllMocks()
  })

  it('calls onUncaughtError when an error is caught', async () => {
    const onUncaughtError = vi.fn()
    const onCatch = vi.fn()

    const ThrowErrorComponent = () => {
      throw new Error('An EXPECTED, testing error occurred!')
    }

    const client = createMockSanityClient() as unknown as SanityClient

    const TestProvider = await createTestProvider({
      client,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        onUncaughtError,
      },
    })

    render(
      <TestProvider>
        <ErrorBoundary onCatch={onCatch}>
          <ThrowErrorComponent />
        </ErrorBoundary>
      </TestProvider>,
    )

    expect(onUncaughtError).toHaveBeenCalledTimes(1)
  })

  it('calls onCatch prop when an error is caught when no onUncaughtError exists', () => {
    const onCatch = vi.fn()

    const WrapperWithoutError = ({children}: {children: React.ReactNode}) => {
      const locales = [usEnglishLocale]
      const {i18next} = prepareI18n({
        projectId: 'test',
        dataset: 'test',
        name: 'test',
      })

      return (
        <Root as="div">
          <LocaleProviderBase
            projectId={'test'}
            sourceId={'test'}
            locales={locales}
            i18next={i18next}
          >
            {children}
          </LocaleProviderBase>
        </Root>
      )
    }

    const ThrowErrorComponent = () => {
      throw new Error('An EXPECTED, testing error occurred!')
    }

    render(
      <WrapperWithoutError>
        <ErrorBoundary onCatch={onCatch}>
          <ThrowErrorComponent />
        </ErrorBoundary>
      </WrapperWithoutError>,
    )

    expect(onCatch).toHaveBeenCalledTimes(1)
  })
})
