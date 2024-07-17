import {studioTheme, ThemeProvider} from '@sanity/ui'
import {type ReactNode} from 'react'

import {
  createTestProvider,
  type TestProviderOptions,
} from '../../../../../test/testUtils/TestProvider'

/**
 * @internal
 * @hidden
 */
export const createWrapper = async (options?: TestProviderOptions) => {
  const TestProvider = await createTestProvider(options)
  return function Wrapper({children}: {children: ReactNode}): JSX.Element {
    return (
      <ThemeProvider theme={studioTheme}>
        <TestProvider>{children}</TestProvider>
      </ThemeProvider>
    )
  }
}
