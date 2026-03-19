import {type Asset} from '@sanity/types'
import {Box, Flex, Grid, Spinner, Text} from '@sanity/ui'
import {type KeyboardEvent, type MouseEvent} from 'react'
import {AssetThumb} from './AssetThumb'
import {thumbGrid} from './ImageListView.css'

interface ImageListViewProps {
  isLoading?: boolean
  assets: Asset[]
  selectedAssets: Asset[]
  onItemClick: (event: MouseEvent) => void
  onItemKeyPress: (event: KeyboardEvent) => void
  onDeleteFinished: (assetId: string) => void
}


export function ImageListView(props: ImageListViewProps) {
  const {isLoading, assets, selectedAssets, onItemClick, onItemKeyPress, onDeleteFinished} = props
  return (
    <Box padding={4}>
      <Grid className={thumbGrid} gap={2}>
        {assets.map((asset) => (
          <AssetThumb
            key={asset._id}
            asset={asset}
            isSelected={selectedAssets.some((selected) => selected._id === asset._id)}
            onClick={onItemClick}
            onKeyPress={onItemKeyPress}
            onDeleteFinished={onDeleteFinished}
          />
        ))}
      </Grid>
      {isLoading && assets.length === 0 && (
        <Flex justify="center">
          <Spinner muted />
        </Flex>
      )}
      {!isLoading && assets.length === 0 && <Text align="center" muted />}
    </Box>
  )
}
