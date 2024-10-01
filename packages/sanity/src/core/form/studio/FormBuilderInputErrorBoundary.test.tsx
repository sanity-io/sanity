import {beforeAll, describe, expect, it, jest} from '@jest/globals'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'

import {LocaleProviderBase} from '../../i18n/components/LocaleProvider'
import {prepareI18n} from '../../i18n/i18nConfig'
import {usEnglishLocale} from '../../i18n/locales'
import {useSource} from '../../studio/source'
import {FormBuilderInputErrorBoundary} from './FormBuilderInputErrorBoundary'

// Mock dependencies
jest.mock('../../studio/source', () => ({
  useSource: jest.fn(),
}))

jest.mock('use-hot-module-reload', () => ({
  useHotModuleReload: jest.fn(),
}))

const useSourceMock = useSource as jest.Mock

describe('FormBuilderInputErrorBoundary', () => {
  beforeAll(() => {
    jest.clearAllMocks()
  })

  it('renders children when there is no error', async () => {
    render(
      <FormBuilderInputErrorBoundary>
        <div data-testid="child">Child Component</div>
      </FormBuilderInputErrorBoundary>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('calls onStudioError when an error is caught', async () => {
    const onStudioError = jest.fn()
    useSourceMock.mockReturnValue({onStudioError})

    const ThrowErrorComponent = () => {
      throw new Error('An EXPECTED, testing error occurred!')
    }

    const locales = [usEnglishLocale]
    const {i18next} = prepareI18n({
      projectId: 'test',
      dataset: 'test',
      name: 'test',
    })

    render(
      <ThemeProvider theme={studioTheme}>
        <LocaleProviderBase
          projectId={'test'}
          sourceId={'test'}
          locales={locales}
          i18next={i18next}
        >
          <FormBuilderInputErrorBoundary>
            <ThrowErrorComponent />
          </FormBuilderInputErrorBoundary>
        </LocaleProviderBase>
      </ThemeProvider>,
    )

    expect(onStudioError).toHaveBeenCalledTimes(1)
  })
})
