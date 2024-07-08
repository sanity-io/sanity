import {studioTheme, ThemeProvider} from '@sanity/ui'
import {type ReactNode} from 'react'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'

export const createWrapper = async () => {
  const TestProvider = await createTestProvider()
  return function Wrapper({children}: {children: ReactNode}): JSX.Element {
    return (
      <ThemeProvider theme={studioTheme}>
        <TestProvider>{children}</TestProvider>
      </ThemeProvider>
    )
  }
}
