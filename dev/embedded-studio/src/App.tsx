import {
  defineConfig,
  StudioProvider,
  StudioLayout,
  defineType,
  StudioThemeColorSchemeKey,
  Studio,
} from 'sanity'
import {deskTool} from 'sanity/desk'
import {Button, Card, Flex, ThemeProvider, studioTheme, usePrefersDark} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

const BLOG_POST_SCHEMA = defineType({
  type: 'document',
  name: 'blogPost',
  title: 'Blog post',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
  ],
})

const SCHEMA_TYPES = [BLOG_POST_SCHEMA]

const config = defineConfig({
  projectId: 'ppsg7ml5',
  dataset: 'test',

  document: {
    unstable_comments: {
      enabled: true,
    },
  },

  schema: {
    types: SCHEMA_TYPES,
  },

  plugins: [deskTool()],
})

export function App() {
  const prefersDark = usePrefersDark()
  const [variant, setVariant] = useState<'layout' | 'studio'>('layout')

  const initialScheme = prefersDark ? 'dark' : 'light'
  const [scheme, setScheme] = useState<StudioThemeColorSchemeKey>(initialScheme)

  const _scheme = useMemo(
    () => (scheme === 'system' ? initialScheme : scheme),
    [initialScheme, scheme],
  )

  const handleSchemeChange = useCallback((nextScheme: StudioThemeColorSchemeKey) => {
    setScheme(nextScheme)
  }, [])

  const handleSetLayoutVariant = useCallback(() => {
    setVariant('layout')
  }, [])

  const handleSetStudioVariant = useCallback(() => {
    setVariant('studio')
  }, [])

  return (
    <ThemeProvider scheme={_scheme} theme={studioTheme}>
      <Flex direction="column" height="fill" overflow="hidden">
        <Card>
          <Flex gap={1} padding={2}>
            <Button
              fontSize={1}
              mode="ghost"
              onClick={handleSetLayoutVariant}
              padding={2}
              selected={variant === 'layout'}
              text="StudioLayout"
              tone="primary"
            />
            <Button
              fontSize={1}
              mode="ghost"
              onClick={handleSetStudioVariant}
              padding={2}
              selected={variant === 'studio'}
              text="Studio"
              tone="primary"
            />
          </Flex>
        </Card>

        <Flex direction="column" flex={1}>
          {variant === 'layout' && (
            <StudioProvider config={config} onSchemeChange={handleSchemeChange}>
              <StudioLayout />
            </StudioProvider>
          )}

          {variant === 'studio' && <Studio config={config} onSchemeChange={handleSchemeChange} />}
        </Flex>
      </Flex>
    </ThemeProvider>
  )
}
