import React, {createContext, useContext} from 'react'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {LogoProps, NavbarProps, LayoutProps, createPlugin, ToolMenuProps} from 'sanity'

export const studioComponentsPlugin = createPlugin({
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
            This banner is rendered with <code>{`components.Navbar`}</code> in{' '}
            <code>{`createConfig`}</code>
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
