import {LegacyLayerProvider} from '@sanity/base/components'
import {Box, Card, Text, Layer, useTheme} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const RootCard = styled(Card)`
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
`

const features = {
  inverted: true,
}

export function Navbar() {
  const theme = useTheme()
  const {dark} = theme.sanity.color

  return (
    <LegacyLayerProvider zOffset="navbar">
      <Layer>
        <RootCard
          scheme={features.inverted ? 'dark' : undefined}
          shadow={features.inverted ? (dark ? 1 : 0) : 1}
        >
          <Box padding={4}>
            <Text weight="bold">Studio</Text>
          </Box>
        </RootCard>
      </Layer>
    </LegacyLayerProvider>
  )
}
