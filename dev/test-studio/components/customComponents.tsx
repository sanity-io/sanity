import React, {createContext, useContext} from 'react'
import {Box, Button, Card, Stack, Text} from '@sanity/ui'
import {LogoProps} from 'sanity'
import {RobotIcon} from '@sanity/icons'

// Layout
const TitleContext = createContext<string>('')
const useTitleContext = () => useContext(TitleContext)

export function CustomLayout({children}: {children: React.ReactNode}) {
  return (
    <TitleContext.Provider value="Context value">
      <Box height="fill" data-testid="custom-studio-layout">
        {children}
      </Box>
    </TitleContext.Provider>
  )
}

// Logo
export function CustomLogo(props: LogoProps) {
  const {onClick, href} = props
  const title = useTitleContext()

  return (
    <Button
      as="a"
      fontSize={1}
      data-testid="custom-logo"
      href={href}
      icon={RobotIcon}
      mode="ghost"
      onClick={onClick}
      padding={3}
      text={title}
      tone="primary"
    />
  )
}

// Navbar
export function CustomNavbar({children}: {children: React.ReactNode}) {
  return (
    <Stack>
      <Card padding={4} tone="primary">
        <Text weight="semibold" size={1}>
          This banner is rendered with <code>{`renderNavbar`}</code> in{' '}
          <code>{`createConfig`}</code>
        </Text>
      </Card>
      {children}
    </Stack>
  )
}

export function CustomToolMenu({children}: {children: React.ReactNode}) {
  return (
    <Card
      data-testid="custom-tool-menu"
      paddingX={1}
      radius={2}
      shadow={1}
      sizing="border"
      tone="primary"
    >
      {children}
    </Card>
  )
}
