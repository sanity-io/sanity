import React, {createContext, useCallback, useContext, useEffect, useState} from 'react'
import {Box, Button, Card, Dialog, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {
  LogoProps,
  NavbarProps,
  LayoutProps,
  definePlugin,
  ToolMenuProps,
  NewDocumentProps,
  DefaultPreview,
} from 'sanity'
import {AddIcon, SearchIcon} from '@sanity/icons'
import {IntentLink} from 'sanity/router'

export const studioComponentsPlugin = definePlugin({
  name: 'studio-components-plugin',
  studio: {
    components: {
      layout: (props) => (
        <Box height="fill" data-testid="test-layout-plugin">
          {props.renderDefault(props)}
        </Box>
      ),
      logo: (props) => <Box data-testid="test-logo-plugin">{props.renderDefault(props)}</Box>,
      navbar: (props) => <Box data-testid="test-navbar-plugin">{props.renderDefault(props)}</Box>,
      toolMenu: (props) => (
        <Box data-testid="test-tool-menu-plugin">{props.renderDefault(props)}</Box>
      ),
    },
  },
})

// Layout
const TitleContext = createContext<string>('')
const useTitleContext = () => useContext(TitleContext)

export function CustomLayout(props: LayoutProps) {
  const {renderDefault} = props

  return (
    <TitleContext.Provider value="Context value">
      <Box height="fill" data-testid="test-layout-config">
        {renderDefault(props)}
      </Box>
    </TitleContext.Provider>
  )
}

// Logo
export function CustomLogo(props: LogoProps) {
  const title = useTitleContext()

  return props.renderDefault({...props, title})
}

// Navbar
export function CustomNavbar(props: NavbarProps) {
  return (
    <Stack data-testid="test-navbar-config">
      <Card padding={4} tone="primary" data-testid="test-navbar-banner-config">
        <Flex align="center" gap={4}>
          <Text weight="semibold" size={1}>
            This banner is rendered with <code>{`components.navbar`}</code> in{' '}
            <code>{`defineConfig`}</code>
          </Text>
        </Flex>
      </Card>

      {props.renderDefault(props)}
    </Stack>
  )
}

// ToolMenu
export function CustomToolMenu(props: ToolMenuProps) {
  return (
    <Card
      data-testid="test-tool-menu-config"
      paddingX={1}
      paddingY={props.context === 'sidebar' ? 1 : undefined}
      radius={2}
      shadow={1}
      sizing="border"
      tone="primary"
    >
      {props.renderDefault(props)}
    </Card>
  )
}

export function CustomNewDocument(props: NewDocumentProps) {
  const {options, loading} = props

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<string>('')

  const toggleOpen = useCallback(() => setOpen((v) => !v), [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  const filteredOptions = options.filter((option) => {
    return (option.title || option.id).toLowerCase().includes(query.toLowerCase())
  })

  useEffect(() => {
    return () => {
      setQuery('')
    }
  }, [])

  return (
    <>
      <Button
        icon={AddIcon}
        loading={loading}
        mode="bleed"
        onClick={toggleOpen}
        text="Create new document"
      />

      {open && (
        <Dialog
          header="Custom create new document"
          id="create-new-document"
          onClickOutside={toggleOpen}
          onClose={toggleOpen}
          width={1}
          scheme="light"
        >
          <Card padding={2} borderBottom>
            <TextInput icon={SearchIcon} placeholder="Search" onChange={handleSearchChange} />
          </Card>

          {filteredOptions.length === 0 && (
            <Flex align="center" justify="center" paddingY={6}>
              <Text align="center" muted>
                No results for <code>{query}</code>
              </Text>
            </Flex>
          )}

          <Stack space={3} padding={filteredOptions.length > 0 ? 3 : 0}>
            {filteredOptions.map((option) => (
              <Stack key={option.id}>
                <Card
                  as={IntentLink}
                  data-as="a"
                  intent="create"
                  radius={3}
                  padding={2}
                  params={{template: option.templateId, type: option.schemaType}}
                  onClick={toggleOpen}
                >
                  <DefaultPreview
                    media={option.icon}
                    title={option.title}
                    description={option.description}
                  />
                </Card>
              </Stack>
            ))}
          </Stack>
        </Dialog>
      )}
    </>
  )
}
