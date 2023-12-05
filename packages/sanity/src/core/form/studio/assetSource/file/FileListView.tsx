import React from 'react'
import {Box, Card, Flex, Grid, Spinner, Stack, Text, useMediaIndex} from '@sanity/ui'
import {Asset} from '@sanity/types'
import {useTranslation} from '../../../../i18n'
import {AssetRow} from './AssetRow'

interface Props {
  onClick?: (event: React.MouseEvent) => void
  onKeyPress?: (event: React.KeyboardEvent) => void
  onDeleteFinished: (assetId: string) => void
  assets: Asset[]
  isLoading?: boolean
  selectedAssets: Asset[]
}

const STYLES_FILENAME = {paddingLeft: '2.2rem'}
const STYLES_GRID = {gridTemplateColumns: '3fr 1fr 1fr 2fr 30px'}

export function FileListView(props: Props) {
  const mediaIndex = useMediaIndex()
  const isMobile = mediaIndex < 2
  const {assets, onClick, onKeyPress, onDeleteFinished, selectedAssets, isLoading} = props

  const {t} = useTranslation()
  return (
    <Box>
      <Card borderBottom paddingBottom={2} marginBottom={1}>
        {isMobile ? (
          <Grid style={STYLES_GRID}>
            <Box flex={2} paddingLeft={5}>
              <Text muted size={1} weight="medium">
                {t('asset-source.file.asset-list.header.filename')}
              </Text>
            </Box>
          </Grid>
        ) : (
          <Grid gap={1} style={STYLES_GRID}>
            <Box flex={2} style={STYLES_FILENAME}>
              <Text muted size={1} weight="medium">
                {t('asset-source.file.asset-list.header.filename')}
              </Text>
            </Box>
            <Box flex={1}>
              <Text muted size={1} weight="medium">
                {t('asset-source.file.asset-list.header.size')}
              </Text>
            </Box>
            <Box flex={1}>
              <Text muted size={1} weight="medium">
                {t('asset-source.file.asset-list.header.type')}
              </Text>
            </Box>
            <Box flex={1}>
              <Text muted size={1} weight="medium">
                {t('asset-source.file.asset-list.header.date-added')}
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
