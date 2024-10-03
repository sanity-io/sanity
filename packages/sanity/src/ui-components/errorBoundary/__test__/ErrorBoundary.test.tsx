import {beforeAll, describe, expect, it, jest} from '@jest/globals'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render} from '@testing-library/react'

import {LocaleProviderBase, usEnglishLocale} from '../../../core/i18n'
import {prepareI18n} from '../../../core/i18n/i18nConfig'
import {ErrorBoundary} from '../ErrorBoundary'

describe('ErrorBoundary', () => {
  beforeAll(() => {
    jest.clearAllMocks()
  })

  const Wrapper = ({children}: {children: React.ReactNode}) => {
    const locales = [usEnglishLocale]
    const {i18next} = prepareI18n({
      projectId: 'test',
      dataset: 'test',
      name: 'test',
    })

    return (
      <ThemeProvider theme={studioTheme}>
        <LocaleProviderBase
          projectId={'test'}
          sourceId={'test'}
          locales={locales}
          i18next={i18next}
        >
          {children}
        </LocaleProviderBase>
      </ThemeProvider>
    )
  }

  it('calls onStudioError when an error is caught', () => {
    const onStudioError = jest.fn()
    const onCatch = jest.fn()

    const ThrowErrorComponent = () => {
      throw new Error('An EXPECTED, testing error occurred!')
    }

    render(
      <Wrapper>
        <ErrorBoundary onCatch={onCatch}>
          <ThrowErrorComponent />
        </ErrorBoundary>
      </Wrapper>,
    )

    expect(onStudioError).toHaveBeenCalledTimes(1)
  })

  it('calls onCatch prop when an error is caught when no onStudioError exists', () => {
    const onCatch = jest.fn()

    const WrapperWithoutError = ({children}: {children: React.ReactNode}) => {
      const locales = [usEnglishLocale]
      const {i18next} = prepareI18n({
        projectId: 'test',
        dataset: 'test',
        name: 'test',
      })

      return (
        <ThemeProvider theme={studioTheme}>
          <LocaleProviderBase
            projectId={'test'}
            sourceId={'test'}
            locales={locales}
            i18next={i18next}
          >
            {children}
          </LocaleProviderBase>
        </ThemeProvider>
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
