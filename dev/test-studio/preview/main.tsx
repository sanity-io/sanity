import {Box, Flex, studioTheme, Tab, TabList, TabPanel, ThemeProvider} from '@sanity/ui'
import {enableVisualEditing} from '@sanity/visual-editing'
import {Suspense, useEffect, useState} from 'react'
import {createRoot} from 'react-dom/client'

import {FieldGroups} from './FieldGroups'
import {InitialValues} from './InitialValues'
import {useLiveMode} from './loader'
import {LongList} from './LongList'
import {Markdown} from './Markdown'
import {SimpleBlockPortableText} from './SimpleBlockPortableText'

function Main() {
  const [id, setId] = useState<'simple' | 'nested' | 'markdown' | 'longlist' | 'initialvalues'>(
    'markdown',
  )
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
                aria-controls="markdown-panel"
                id="markdown-tab"
                label="Markdown"
                onClick={() => setId('markdown')}
                selected={id === 'markdown'}
              />
              <Tab
                aria-controls="longlist-panel"
                id="longlist-tab"
                label="Long List"
                onClick={() => setId('longlist')}
                selected={id === 'longlist'}
              />
              <Tab
                aria-controls="initialvalues-panel"
                id="initialvalues-tab"
                label="Initial Values"
                onClick={() => setId('initialvalues')}
                selected={id === 'initialvalues'}
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

          {id === 'markdown' && (
            <TabPanel aria-labelledby="markdown-tab" id="markdown-panel">
              <Markdown />
            </TabPanel>
          )}
          {id === 'longlist' && (
            <TabPanel aria-labelledby="longlist-tab" id="longlist-panel">
              <LongList />
            </TabPanel>
          )}
          {id === 'initialvalues' && (
            <TabPanel aria-labelledby="initialvalues-tab" id="initialvalues-panel">
              <InitialValues />
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
