import React, {useContext, createContext} from 'react'
import {Box, Card, Text} from '@sanity/ui'
import {createPlugin} from 'sanity'

interface ComponentProps {
  children: React.ReactNode
}

export const customComponentsPlugin2 = createPlugin({
  name: 'custom-components-plugin-2',
  studio: {
    components: {
      Layout: ({children}) => (
        <Box data-testid="custom-layout-plugin-2" height="fill">
          {children}
        </Box>
      ),
      Logo: ({children}) => <Box data-testid="custom-logo-plugin-2">{children}</Box>,
      Navbar: ({children}) => <Box data-testid="custom-navbar-plugin-2">{children}</Box>,
      ToolMenu: ({children}) => <Box data-testid="custom-tool-menu-plugin-2">{children}</Box>,
    },
  },
})

export const customComponentsPlugin = createPlugin({
  name: 'custom-components-plugin',
  plugins: [customComponentsPlugin2()],
  studio: {
    components: {
      Layout: ({children}) => (
        <Box data-testid="custom-layout-plugin" height="fill">
          {children}
        </Box>
      ),
      Logo: ({children}) => <Box data-testid="custom-logo-plugin">{children}</Box>,
      Navbar: ({children}) => <Box data-testid="custom-navbar-plugin">{children}</Box>,
      ToolMenu: ({children}) => <Box data-testid="custom-tool-menu-plugin">{children}</Box>,
    },
  },
})

// Components used in createConfig
const LogoTextContext = createContext('')
const useLogoText = () => useContext(LogoTextContext)

export function LayoutConfigComponent(props: ComponentProps) {
  return (
    <LogoTextContext.Provider value={'Text from context'}>
      <Box height="fill" data-testid="custom-layout-config">
        {props.children}
      </Box>
    </LogoTextContext.Provider>
  )
}

export function LogoConfigComponent() {
  const text = useLogoText()

  return (
    <Text weight="semibold" size={1} data-testid="custom-logo-config">
      {text}
    </Text>
  )
}

export function NavbarConfigComponent(props: ComponentProps) {
  return (
    <Card data-testid="custom-navbar-config">
      <Card paddingY={4} paddingX={3} tone="primary" sizing="border">
        <Text>
          This is a banner from <code>{`studio.components.Navbar`}</code> in{' '}
          <code>{`createConfig`}</code>
        </Text>
      </Card>

      {props.children}
    </Card>
  )
}

export function ToolMenuConfigComponent(props: ComponentProps) {
  return (
    <Card
      data-testid="custom-tool-menu-config"
      paddingX={1}
      radius={2}
      scheme="light"
      shadow={1}
      sizing="border"
      tone="primary"
    >
      {props.children}
    </Card>
  )
}
