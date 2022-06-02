import type {Subscription} from 'rxjs'
import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react'
import {DownloadIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Grid, Spinner, Text} from '@sanity/ui'
import {Asset as AssetType, AssetFromSource, AssetSourceComponentProps} from '@sanity/types'
import {uniqueId} from 'lodash'
import styled from 'styled-components'
import {useClient} from '../../../hooks'
import {AssetThumb} from './AssetThumb'
import {TableList} from './TableList'

const PER_PAGE = 200
const ASSET_TYPE_IMAGE = 'sanity.imageAsset'
const ASSET_TYPE_FILE = 'sanity.fileAsset'

const buildQuery = (start = 0, end = PER_PAGE, assetType = ASSET_TYPE_IMAGE) => `
  *[_type == "${assetType}"] | order(_updatedAt desc) [${start}...${end}] {
    _id,
    _updatedAt,
    _createdAt,
    url,
    originalFilename,
    mimeType,
    extension,
    size,
    metadata {dimensions}
  }
`

const ThumbGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
`

const CardLoadMore = styled(Card)`
  border-top: 1px solid var(--card-border-color);
  position: sticky;
  bottom: 0;
  z-index: 200;
`

const DefaultAssetSource = function DefaultAssetSource(
  props: AssetSourceComponentProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const client = useClient()
  const versionedClient = useMemo(() => client.withConfig({apiVersion: '1'}), [client])
  const _elementId = useRef(`default-asset-source-${uniqueId()}`)
  const currentPageNumber = useRef(0)
  const fetch$ = useRef<Subscription>()
  const [assets, setAssets] = useState<AssetType[]>([])
  const [isLastPage, setIsLastPage] = useState(false)
  const [hasResetAutoFocus, setHasResetFocus] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const {
    selectedAssets,
    assetType = 'image',
    dialogHeaderTitle = 'Select image',
    onClose,
    onSelect,
  } = props

  const fetchPage = useCallback(
    (pageNumber: number) => {
      const start = pageNumber * PER_PAGE
      const end = start + PER_PAGE
      const isImageAssetType = assetType === 'image'
      const tag = isImageAssetType ? 'asset.image-list' : 'asset.file-list'
      const assetTypeParam = isImageAssetType ? ASSET_TYPE_IMAGE : ASSET_TYPE_FILE

      setIsLoading(true)

      fetch$.current = versionedClient.observable
        .fetch(buildQuery(start, end, assetTypeParam), {}, {tag})
        .subscribe((result) => {
          setIsLastPage(result.length < PER_PAGE)
          // eslint-disable-next-line max-nested-callbacks
          setAssets((prevState) => prevState.concat(result))
          setIsLoading(false)
        })
    },
    [assetType, setIsLoading, setAssets, setIsLastPage, versionedClient]
  )

  const handleDeleteFinished = useCallback(
    (id) => {
      // eslint-disable-next-line max-nested-callbacks
      setAssets((prevState) => prevState.filter((asset) => asset._id !== id))
    },
    [setAssets]
  )

  const select = useCallback(
    (id) => {
      const selected = assets.find((doc) => doc._id === id)

      if (selected) {
        const selectedSource: AssetFromSource[] = [{kind: 'assetDocumentId', value: id}]

        onSelect(selectedSource)
      }
    },
    [assets, onSelect]
  )

  const handleItemClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()

      select(event.currentTarget.getAttribute('data-id'))
    },
    [select]
  )

  const handleItemKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        select(event.currentTarget.getAttribute('data-id'))
      }
    },
    [select]
  )

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const handleFetchNextPage = useCallback(
    (event) => {
      event.preventDefault()
      fetchPage(++currentPageNumber.current)
    },
    [fetchPage]
  )

  useEffect(() => {
    fetchPage(currentPageNumber.current)

    return () => {
      if (fetch$.current) {
        fetch$.current.unsubscribe()
      }
    }
  }, [fetchPage])

  useEffect(() => {
    // We focus on the first item after we're doing loading, but only on initial load, as
    // this will reset the scroll position to the top if we do it on the second page
    if (!isLoading && (!currentPageNumber.current || currentPageNumber.current === 0)) {
      setHasResetFocus(true)
    }
  }, [isLoading])

  const renderedThumbView = useMemo(() => {
    return (
      <Box padding={4}>
        <ThumbGrid gap={2}>
          {assets.map((asset) => (
            <AssetThumb
              key={asset._id}
              asset={asset}
              isSelected={selectedAssets.some((selected) => selected._id === asset._id)}
              onClick={handleItemClick}
              onKeyPress={handleItemKeyPress}
              onDeleteFinished={handleDeleteFinished}
            />
          ))}
        </ThumbGrid>

        {isLoading && assets.length === 0 && (
          <Flex justify="center">
            <Spinner muted />
          </Flex>
        )}

        {!isLoading && assets.length === 0 && (
          <Text align="center" muted>
            No images
          </Text>
        )}
      </Box>
    )
  }, [assets, handleDeleteFinished, handleItemClick, handleItemKeyPress, isLoading, selectedAssets])

  const renderedTableView = useMemo(() => {
    return (
      <TableList
        isLoading={isLoading}
        assets={assets}
        selectedAssets={selectedAssets}
        onClick={handleItemClick}
        onKeyPress={handleItemKeyPress}
        onDeleteFinished={handleDeleteFinished}
      />
    )
  }, [isLoading, assets, selectedAssets, handleItemClick, handleItemKeyPress, handleDeleteFinished])

  return (
    <Dialog
      ref={ref}
      id={_elementId.current}
      header={dialogHeaderTitle}
      width={2}
      onClose={handleClose}
      __unstable_autoFocus={hasResetAutoFocus}
    >
      {assetType === 'image' && renderedThumbView}
      {assetType === 'file' && renderedTableView}
      {assets.length > 0 && !isLastPage && (
        <CardLoadMore tone="default" padding={4}>
          <Flex direction="column">
            <Button
              type="button"
              icon={DownloadIcon}
              loading={isLoading}
              onClick={handleFetchNextPage}
              text="Load more"
              tone="primary"
            />
          </Flex>
        </CardLoadMore>
      )}
    </Dialog>
  )
}

export const DefaultSource = React.memo(React.forwardRef(DefaultAssetSource))
