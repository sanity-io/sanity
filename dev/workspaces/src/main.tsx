import {SanityConfig} from '@sanity/base'
import {StudioRoot} from '@sanity/base/studio'
import {ColorHueKey, hues, white} from '@sanity/color'
import {SanityMonogram} from '@sanity/logos'
import {
  Box,
  Card,
  ErrorBoundary,
  Flex,
  Layer,
  Stack,
  studioTheme,
  Text,
  ThemeProvider,
  Tooltip,
} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import ReactDOM from 'react-dom'
import Refractor from 'react-refractor'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'

// Studio configs
import emptyConfig from './empty/sanity.config'
import multiSourceConfig from './multi-source/sanity.config'
import singleSourceConfig from './single-source/sanity.config'
import pluginSchemaTypesConfig from './plugin-schema-types/sanity.config'

Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

const workspaces: {name: string; config: SanityConfig; hue: ColorHueKey}[] = [
  {name: 'single-source', config: singleSourceConfig, hue: 'blue'},
  {name: 'multi-source', config: multiSourceConfig, hue: 'purple'},
  {name: 'empty', config: emptyConfig, hue: 'magenta'},
  {name: 'plugin-schema-types', config: pluginSchemaTypesConfig, hue: 'red'},
]

function Root() {
  const segments = window.location.pathname.split('/').filter(Boolean)
  const [workspaceName, setWorkspaceName] = useState(() => segments[0] || workspaces[0]?.name)
  const currentWorkspace = workspaces.find((s) => s.name === workspaceName)

  const handleError = useCallback((params: {error: Error; info: React.ErrorInfo}) => {
    // eslint-disable-next-line no-console
    console.log('@todo: handle react error:', params)
  }, [])

  if (!currentWorkspace) {
    return (
      <>
        Scenario not found: <code>{workspaceName}</code>
      </>
    )
  }

  return (
    <ThemeProvider theme={studioTheme}>
      <ErrorBoundary onCatch={handleError}>
        <Flex height="fill">
          <Layer zOffset={110}>
            <Card height="fill" shadow={1} padding={2} scheme="dark">
              <Stack space={2}>
                {workspaces.map((workspace) => {
                  const hue = hues[workspace.hue]

                  return (
                    <Tooltip
                      content={
                        <Box padding={2}>
                          <Text size={1}>{workspace.config.project.name}</Text>
                        </Box>
                      }
                      key={workspace.name}
                      placement="right"
                      portal
                    >
                      <Card
                        as="button"
                        onClick={() => setWorkspaceName(workspace.name)}
                        radius={3}
                        padding={3}
                        selected={currentWorkspace === workspace}
                        value={workspace.name}
                      >
                        <Text size={4}>
                          <SanityMonogram
                            color={{bg1: hue[500].hex, bg2: hue[200].hex, fg: white.hex}}
                          />
                        </Text>
                      </Card>
                    </Tooltip>
                  )
                })}
              </Stack>
            </Card>
          </Layer>
          <Box
            flex={1}
            // overflow="hidden"
          >
            <StudioRoot config={currentWorkspace.config} />
          </Box>
        </Flex>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

ReactDOM.render(<Root />, document.getElementById('root'))
