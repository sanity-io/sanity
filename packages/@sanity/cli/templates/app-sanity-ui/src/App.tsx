import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react'
import {Flex, Spinner, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ExampleComponent} from './ExampleComponent'

const theme = buildTheme()

export function App() {
  // apps can access many different projects or other sources of data
  const sanityConfigs: SanityConfig[] = [
    {
      projectId: 'project-id',
      dataset: 'dataset-name',
    }
  ]

  function Loading() {
    return (
      <Flex justify='center' align='center' width='100vw' height='fill'>
        <Spinner />
      </Flex>
    )
  }

  return (
    <SanityApp config={sanityConfigs} fallback={<Loading />}>
      <ThemeProvider theme={theme}>
        {/* add your own components here! */}
        <ExampleComponent />
      </ThemeProvider>
    </SanityApp>
  )
}

export default App
