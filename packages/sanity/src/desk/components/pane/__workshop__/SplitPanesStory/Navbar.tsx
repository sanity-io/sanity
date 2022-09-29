import {Box, Card, Flex, Text, Layer, useTheme} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled from 'styled-components'
import {LegacyLayerProvider} from 'sanity'

const RootCard = styled(Card)`
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
`

const features = {
  inverted: true,
}

export function Navbar(props: {
  path: string[]
  setPath: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const {path, setPath} = props
  const theme = useTheme()
  const {dark} = theme.sanity.color

  const handleHomeClick = useCallback(() => {
    setPath(path.slice(0, 1))
  }, [path, setPath])

  return (
    <LegacyLayerProvider zOffset="navbar">
      <Layer>
        <RootCard
          scheme={features.inverted ? 'dark' : undefined}
          shadow={features.inverted ? (dark ? 1 : 0) : 1}
        >
          <Flex>
            <Box padding={2}>
              <Card as="button" onClick={handleHomeClick} padding={3} radius={2}>
                <Text weight="bold">Studio</Text>
              </Card>
            </Box>
          </Flex>
        </RootCard>
      </Layer>
    </LegacyLayerProvider>
  )
}
