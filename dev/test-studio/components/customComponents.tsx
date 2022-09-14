import React, {createContext, useContext} from 'react'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {LogoProps, NavbarProps, LayoutProps, createPlugin, ToolMenuProps} from 'sanity'

export const componentsPlugin = createPlugin({
  name: 'components-plugin',
  studio: {
    components: {
      Layout: (props) => (
        <Box height="fill" data-testid="test-layout-plugin">
          {props.renderLayout(props)}
        </Box>
      ),
      Logo: (props) => <Box data-testid="test-logo-plugin">{props.renderLogo(props)}</Box>,
      Navbar: (props) => <Box data-testid="test-navbar-plugin">{props.renderNavbar(props)}</Box>,
      ToolMenu: (props) => (
        <Box data-testid="test-tool-menu-plugin">{props.renderToolMenu(props)}</Box>
      ),
    },
  },
})

// Layout
const TitleContext = createContext<string>('')
const useTitleContext = () => useContext(TitleContext)

export function CustomLayout(props: LayoutProps) {
  const {renderLayout} = props

  return (
    <TitleContext.Provider value="Context value">
      <Box height="fill" data-testid="test-layout-config">
        {renderLayout(props)}
      </Box>
    </TitleContext.Provider>
  )
}

// Logo
export function CustomLogo(props: LogoProps) {
  const title = useTitleContext()

  return props.renderLogo({...props, title})
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

      {props.renderNavbar(props)}
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
      {props.renderToolMenu(props)}
    </Card>
  )
}
