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
  /** Whether multi-select mode is enabled */
  isMultiSelect?: boolean
  /** Set of selected asset IDs in multi-select mode */
  selectedIds?: Set<string>
}

const ThumbGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
`

export function ImageListView(props: ImageListViewProps) {
  const {
    isLoading,
    assets,
    selectedAssets,
    onItemClick,
    onItemKeyPress,
    onDeleteFinished,
    isMultiSelect = false,
    selectedIds,
  } = props
  return (
    <Box padding={4}>
      <ThumbGrid gap={2}>
        {assets.map((asset) => {
          // In multi-select mode, use selectedIds; otherwise use selectedAssets
          const isSelected = isMultiSelect
            ? (selectedIds?.has(asset._id) ?? false)
            : selectedAssets.some((selected) => selected._id === asset._id)

          return (
            <AssetThumb
              key={asset._id}
              asset={asset}
              isSelected={isSelected}
              onClick={onItemClick}
              onKeyPress={onItemKeyPress}
              onDeleteFinished={onDeleteFinished}
              isMultiSelect={isMultiSelect}
            />
          )
        })}
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
