import React from 'react'
import {Box, Card, Flex, Grid, Spinner, Stack, Text, useMediaIndex} from '@sanity/ui'
import {Asset as AssetType} from '@sanity/types'
import {AssetRow} from './AssetRow'

interface Props {
  onClick?: (...args: any[]) => any
  onKeyPress?: (...args: any[]) => any
  onDeleteFinished: (...args: any[]) => any
  assets: AssetType[]
  isLoading?: boolean
  selectedAssets: AssetType[]
}

const STYLES_FILENAME = {paddingLeft: '2.2rem'}
const STYLES_GRID = {gridTemplateColumns: '3fr 1fr 1fr 2fr 30px'}

export function TableList(props: Props) {
  const mediaIndex = useMediaIndex()
  const isMobile = mediaIndex < 2
  const {assets, onClick, onKeyPress, onDeleteFinished, selectedAssets, isLoading} = props

  return (
    <Box padding={4}>
      <Card borderBottom paddingBottom={2} marginBottom={1}>
        {isMobile ? (
          <Grid style={STYLES_GRID}>
            <Box flex={2} paddingLeft={5}>
              <Text muted size={1} weight="medium">
                Filename
              </Text>
            </Box>
          </Grid>
        ) : (
          <Grid gap={1} style={STYLES_GRID}>
            <Box flex={2} style={STYLES_FILENAME}>
              <Text muted size={1} weight="medium">
                Filename
              </Text>
            </Box>
            <Box flex={1}>
              <Text muted size={1} weight="medium">
                Size
              </Text>
            </Box>
            <Box flex={1}>
              <Text muted size={1} weight="medium">
                Type
              </Text>
            </Box>
            <Box flex={1}>
              <Text muted size={1} weight="medium">
                Date added
              </Text>
            </Box>
          </Grid>
        )}
      </Card>
      <Stack>
        {isLoading && assets.length === 0 && (
          <Box paddingTop={4} paddingBottom={2}>
            <Flex justify="center">
              <Spinner muted />
            </Flex>
          </Box>
        )}
        {assets.map((asset) => (
          <AssetRow
            key={asset._id}
            asset={asset}
            isMobile={isMobile}
            isSelected={selectedAssets.some((selected) => selected._id === asset._id)}
            onClick={onClick}
            onKeyPress={onKeyPress}
            onDeleteFinished={onDeleteFinished}
          />
        ))}
      </Stack>
    </Box>
  )
}
