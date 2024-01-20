import {Box, Card, Flex, Layer, Text, useTheme} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useCallback} from 'react'
import {LegacyLayerProvider} from 'sanity'
import styled from 'styled-components'

const RootCard = styled(Card)`
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
`

const features = {
  inverted: true,
}

export function Navbar(props: {path: string[]; setPath: Dispatch<SetStateAction<string[]>>}) {
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
          // eslint-disable-next-line no-nested-ternary
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
