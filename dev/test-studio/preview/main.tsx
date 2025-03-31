import {Box, Flex, studioTheme, Tab, TabList, TabPanel, ThemeProvider} from '@sanity/ui'
import {enableVisualEditing} from '@sanity/visual-editing'
import {Suspense, useEffect, useState} from 'react'
import {createRoot} from 'react-dom/client'

import {FieldGroups} from './FieldGroups'
import {InternationalizedArrayTest} from './InternationalizedArrayTest'
import {useLiveMode} from './loader'
import {SimpleBlockPortableText} from './SimpleBlockPortableText'

function Main() {
  const [id, setId] = useState<'simple' | 'nested' | 'intl-array'>('simple')
  return (
    <>
      <ThemeProvider theme={studioTheme}>
        <Flex direction={'column'}>
          <Box padding={4}>
            <TabList space={2}>
              <Tab
                aria-controls="simple-panel"
                id="simple-tab"
                label="SimpleBlockPortableText"
                onClick={() => setId('simple')}
                selected={id === 'simple'}
              />
              <Tab
                aria-controls="nested-panel"
                id="nested-tab"
                label="FieldGroups"
                onClick={() => setId('nested')}
                selected={id === 'nested'}
              />
              <Tab
                aria-controls="intl-array-panel"
                id="intl-array-tab"
                label="InternationalizedArrayTest"
                onClick={() => setId('intl-array')}
                selected={id === 'intl-array'}
              />
            </TabList>
          </Box>

          {id === 'simple' && (
            <TabPanel aria-labelledby="simple-tab" id="simple-panel">
              <SimpleBlockPortableText />
            </TabPanel>
          )}

          {id === 'nested' && (
            <TabPanel aria-labelledby="nested-tab" id="nested-panel">
              <FieldGroups />
            </TabPanel>
          )}

          {id === 'intl-array' && (
            <TabPanel aria-labelledby="intl-array-tab" id="intl-array-panel">
              <InternationalizedArrayTest />
            </TabPanel>
          )}
        </Flex>
      </ThemeProvider>

      <Suspense fallback={null}>
        <VisualEditing />
      </Suspense>
    </>
  )
}

function VisualEditing() {
  useEffect(() => enableVisualEditing(), [])
  useLiveMode({})

  return null
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found')
}

const root = createRoot(rootEl)
root.render(<Main />)
