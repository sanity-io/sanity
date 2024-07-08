import {studioTheme, ThemeProvider} from '@sanity/ui'
import {type ReactNode} from 'react'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../releases/i18n'

export const createWrapper = async () => {
  const TestProvider = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return function Wrapper({children}: {children: ReactNode}): JSX.Element {
    return (
      <ThemeProvider theme={studioTheme}>
        <TestProvider>{children}</TestProvider>
      </ThemeProvider>
    )
  }
}
