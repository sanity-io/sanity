import {type Asset} from '@sanity/types'
import {Box, Flex, Grid, Spinner, Text} from '@sanity/ui'
import {type KeyboardEvent, type MouseEvent, useState} from 'react'
import {styled} from 'styled-components'

import {AssetThumb} from './AssetThumb'

interface ImageListViewProps {
  isLoading?: boolean
  assets: Asset[]
  selectedAssets: Asset[]
  onItemClick: (event: MouseEvent | MouseEvent[]) => void
  onItemKeyPress: (event: KeyboardEvent) => void
  onDeleteFinished: (assetId: string) => void
}

const ThumbGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
`

export function ImageListView(props: ImageListViewProps) {
  const {isLoading, assets, selectedAssets, onItemClick, onItemKeyPress, onDeleteFinished} = props
  const [selectedDivs, setSelectedDivs] = useState<MouseEvent[]>([])

  function onThumbClick(event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey) {
      const id = event.currentTarget.getAttribute('data-id')

      const exists = selectedDivs.some(
        (target) =>
          (target.target as HTMLElement).getAttribute('data-id') ===
          (event.currentTarget as HTMLElement).getAttribute('data-id'),
      )
      const array = exists
        ? selectedDivs.filter(
            (target) =>
              (target.target as HTMLElement).getAttribute('data-id') !==
              event.currentTarget.getAttribute('data-id'),
          )
        : [...(selectedDivs || []), event]
      setSelectedDivs(array)
      onItemClick(array)
    } else {
      // If Ctrl is not pressed, just select the clicked div and clear others
      onItemClick(event)
    }
  }

  return (
    <Box padding={4}>
      <ThumbGrid gap={2}>
        {assets.map((asset) => (
          <AssetThumb
            key={asset._id}
            asset={asset}
            isSelected={selectedDivs?.some(
              (selected) => (selected.target as HTMLElement).getAttribute('data-id') === asset._id,
            )}
            onClick={onThumbClick}
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
