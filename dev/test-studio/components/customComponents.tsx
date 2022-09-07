import React, {createContext, useContext} from 'react'
import {Box, Button, Card, Stack, Text} from '@sanity/ui'
import {LogoProps} from 'sanity'
import {RobotIcon} from '@sanity/icons'

// Layout
const TitleContext = createContext<string>('')
const useTitleContext = () => useContext(TitleContext)

export function CustomLayout({children}: {children: React.ReactNode}) {
  return (
    <Box height="fill">
      <TitleContext.Provider value="Context value" data-testid="custom-studio-layout">
        {children}
      </TitleContext.Provider>
    </Box>
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
    <Card tone="primary" radius={2} shadow={1} paddingX={1} sizing="border">
      {children}
    </Card>
  )
}
