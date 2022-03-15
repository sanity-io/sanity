import {ThemeColorSchemeKey, ThemeProvider} from '@sanity/ui'
import React, {useMemo} from 'react'
import {defaultTheme} from '../theme'
import {
  resolveAuth,
  resolveFormBuilder,
  resolvePlugins,
  resolveProject,
  resolveSchemaTypes,
  resolveSources,
} from '../studio/resolveConfig'
import {SourceProvider, SourcesProvider} from '../source'
import {AuthProvider} from '../auth'
import {ConfigProvider, SanityConfig} from '../config'
import {createUserColorManager, UserColorManagerProvider} from '../user-color'
import {NoSourcesScreen} from '../studio/screens/NoSourcesScreen'
import {SanityContext, SanityContextValue} from './SanityContext'

export function SanityProvider(props: {
  children?: React.ReactNode
  config: SanityConfig
  scheme?: ThemeColorSchemeKey
}) {
  const {children, config, scheme = 'light'} = props
  const userColorManager = useMemo(() => createUserColorManager(), [])
  const auth = useMemo(() => resolveAuth({auth: config.auth}), [config])

  const formBuilder = useMemo(
    () =>
      resolveFormBuilder({
        formBuilder: config.formBuilder,
      }),
    [config]
  )

  const plugins = useMemo(() => resolvePlugins(config), [config])
  const project = useMemo(() => resolveProject({config}), [config])

  const schemaTypes = useMemo(
    () =>
      resolveSchemaTypes({
        plugins,
        schemaTypes: config.schemaTypes,
      }),
    [config, plugins]
  )

  const sources = useMemo(
    () =>
      resolveSources({
        sources: config.sources,
        schemaTypes,
      }),
    [config, schemaTypes]
  )

  const sanity: SanityContextValue = useMemo(
    () => ({
      auth,
      formBuilder,
      project,
      schemaTypes,
      sources,
    }),
    [auth, formBuilder, project, schemaTypes, sources]
  )

  const theme = config.theme || defaultTheme

  if (sources.length === 0) {
    return (
      <ThemeProvider scheme={scheme} theme={theme}>
        <NoSourcesScreen />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider scheme={scheme} theme={theme}>
      <ConfigProvider config={config}>
        <SanityContext.Provider value={sanity}>
          <SourcesProvider sources={sources}>
            <SourceProvider>
              <AuthProvider config={config.auth}>
                <UserColorManagerProvider manager={userColorManager}>
                  {children}
                </UserColorManagerProvider>
              </AuthProvider>
            </SourceProvider>
          </SourcesProvider>
        </SanityContext.Provider>
      </ConfigProvider>
    </ThemeProvider>
  )
}
