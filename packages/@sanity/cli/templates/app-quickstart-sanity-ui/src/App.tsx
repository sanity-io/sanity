import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react'
import {ThemeProvider} from '@sanity/ui'
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

  return (
    <div className="app-container">
      <SanityApp sanityConfigs={sanityConfigs} fallback={<div>Loading...</div>}>
        <ThemeProvider theme={theme}>
          {/* add your own components here! */}
          <ExampleComponent />
        </ThemeProvider>
      </SanityApp>
    </div>
  )
}

export default App
