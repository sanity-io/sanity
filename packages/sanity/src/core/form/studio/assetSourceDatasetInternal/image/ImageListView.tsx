import {type Asset} from '@sanity/types'
import {Box, Flex, Grid, Spinner, Text} from '@sanity/ui'
import {type KeyboardEvent, type MouseEvent} from 'react'
import {styled} from 'styled-components'

import {AssetThumb} from './AssetThumb'

interface ImageListViewProps {
  isLoading?: boolean
  assets: Asset[]
  selectedAssets: Asset[]
  onItemClick: (event: MouseEvent) => void
  onItemKeyPress: (event: KeyboardEvent) => void
  onDeleteFinished: (assetId: string) => void
}

const ThumbGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
`

export function ImageListView(props: ImageListViewProps) {
  const {isLoading, assets, selectedAssets, onItemClick, onItemKeyPress, onDeleteFinished} = props
  return (
    <Box padding={4}>
      <ThumbGrid gap={2}>
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
      </ThumbGrid>
      {isLoading && assets.length === 0 && (
        <Flex justify="center">
          <Spinner muted />
        </Flex>
      )}
      {!isLoading && assets.length === 0 && <Text align="center" muted />}
    </Box>
  )
}
