import type {Subscription} from 'rxjs'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {DownloadIcon, InfoOutlineIcon} from '@sanity/icons'
import {Button, Card, Dialog, Flex, Text} from '@sanity/ui'
import {Asset, AssetFromSource, AssetSourceComponentProps} from '@sanity/types'
import {uniqueId} from 'lodash'
import styled from 'styled-components'
import {useClient} from '../../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {FileListView} from '../file/FileListView'
import {ImageListView} from '../image/ImageListView'

const PER_PAGE = 200
const ASSET_TYPE_IMAGE = 'sanity.imageAsset'
const ASSET_TYPE_FILE = 'sanity.fileAsset'

const buildFilterQuery = (acceptParam: string) => {
  const WILDCARD_ACCEPT = ['image/*', 'audio/*', 'video/*']
  const acceptItems = acceptParam.split(',').map((accept) => accept.trim())

  const typesForFilter: {[key: string]: string} = acceptItems.reduce(
    (acceptTypes: {[key: string]: string}, acceptValue: string) => {
      // builds the wildcard part of the groq query
      if (WILDCARD_ACCEPT.includes(acceptValue)) {
        return {
          ...acceptTypes,
          wildcards: `mimeType match '${acceptValue}' || ${acceptTypes.wildcards}`,
        }
      }

      // builds the extension part of the groq query (and removes the .)
      if (acceptValue.indexOf('.') === 0) {
        return {
          ...acceptTypes,
          extensions: `'${acceptValue.replace('.', '')}', ${acceptTypes.extensions}`,
        }
      }

      // all that remains is then the mime types, so we build that part
      return {...acceptTypes, mimes: `'${acceptValue}', ${acceptTypes.mimes}`}
    },
    {mimes: '', extensions: '', wildcards: ''},
  )

  /* when no accept filter is set, we don't need to add the filter condition
  wildcards conditions do not work with arrays so the whole query is built at the top on the condition connected
  with ORs. So when they are empty it means that we can keep the whole first section clean.
  The extension and mimeType work when the arrays are empty returning the right values so they are kept in the query */
  return `&&
  (
    ${typesForFilter.wildcards}
    extension in [${typesForFilter.extensions}] ||
    mimeType in [${typesForFilter.mimes}]
  )`
}

const buildQuery = (
  start = 0,
  end = PER_PAGE,
  assetType = ASSET_TYPE_IMAGE,
  acceptParam: string,
) => {
  const hasAccept = acceptParam.length > 0
  const filterCondition = hasAccept ? buildFilterQuery(acceptParam) : ''

  return `
  *[_type == "${assetType}" ${filterCondition}] | order(_updatedAt desc) [${start}...${end}] {
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
}

const CardLoadMore = styled(Card)`
  border-top: 1px solid var(--card-border-color);
  position: sticky;
  bottom: 0;
  z-index: 200;
`

const DefaultAssetSource = function DefaultAssetSource(
  props: AssetSourceComponentProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const versionedClient = useMemo(() => client.withConfig({apiVersion: '2023-02-14'}), [client])
  const _elementId = useRef(`default-asset-source-${uniqueId()}`)
  const currentPageNumber = useRef(0)
  const fetch$ = useRef<Subscription>()
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLastPage, setIsLastPage] = useState(false)
  const [hasResetAutoFocus, setHasResetFocus] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const {selectedAssets, assetType = 'image', dialogHeaderTitle, onClose, onSelect, accept} = props

  const isImageOnlyWildCard = accept && accept === 'image/*' && assetType === 'image'
  const acceptTypes = accept
    ? accept
        .split(',')
        .map((a) => a.trim())
        .join(', ')
    : ''
  const showAcceptMessage = !isLoading && accept && accept.length > 0
  const fetchPage = useCallback(
    (pageNumber: number) => {
      const start = pageNumber * PER_PAGE
      const end = start + PER_PAGE
      const isImageAssetType = assetType === 'image'
      const tag = isImageAssetType ? 'asset.image-list' : 'asset.file-list'
      const assetTypeParam = isImageAssetType ? ASSET_TYPE_IMAGE : ASSET_TYPE_FILE

      setIsLoading(true)

      if (typeof accept !== 'undefined') {
        fetch$.current = versionedClient.observable
          .fetch(buildQuery(start, end, assetTypeParam, accept), {}, {tag})
          .subscribe((result) => {
            setIsLastPage(result.length < PER_PAGE)
            setAssets((prevState) => prevState.concat(result))
            setIsLoading(false)
          })
      }
    },
    [assetType, accept, versionedClient],
  )

  const handleDeleteFinished = useCallback(
    (id: string) => {
      // eslint-disable-next-line max-nested-callbacks
      setAssets((prevState) => prevState.filter((asset) => asset._id !== id))
    },
    [setAssets],
  )

  const select = useCallback(
    (id: string) => {
      const selected = assets.find((doc) => doc._id === id)

      if (selected) {
        const selectedSource: AssetFromSource[] = [{kind: 'assetDocumentId', value: id}]

        onSelect(selectedSource)
      }
    },
    [assets, onSelect],
  )

  const handleItemClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      const id = event.currentTarget.getAttribute('data-id')
      if (!id) {
        throw new Error('Missing data-id attribute on item')
      }
      select(id)
    },
    [select],
  )

  const handleItemKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        const id = event.currentTarget.getAttribute('data-id')
        if (!id) {
          throw new Error('Missing data-id attribute on item')
        }
        select(id)
      }
    },
    [select],
  )

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const handleFetchNextPage = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      fetchPage(++currentPageNumber.current)
    },
    [fetchPage],
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

  return (
    <Dialog
      __unstable_autoFocus={hasResetAutoFocus}
      header={dialogHeaderTitle}
      id={_elementId.current}
      onClickOutside={handleClose}
      onClose={handleClose}
      ref={ref}
      width={2}
    >
      {showAcceptMessage && !isImageOnlyWildCard && (
        <Card tone="primary" marginTop={4} marginX={4} padding={[3, 3, 4]} border radius={2}>
          <Flex gap={[3, 4]} align="center">
            <Text>
              <InfoOutlineIcon />
            </Text>
            <Text size={1}>
              Only showing assets of accepted types: <b>{acceptTypes}</b>
            </Text>
          </Flex>
        </Card>
      )}
      {assetType === 'file' && (
        <FileListView
          assets={assets}
          onDeleteFinished={handleDeleteFinished}
          onClick={handleItemClick}
          onKeyPress={handleItemKeyPress}
          isLoading={isLoading}
          selectedAssets={selectedAssets}
        />
      )}
      {assetType === 'image' && (
        <ImageListView
          assets={assets}
          onDeleteFinished={handleDeleteFinished}
          onItemClick={handleItemClick}
          onItemKeyPress={handleItemKeyPress}
          isLoading={isLoading}
          selectedAssets={selectedAssets}
        />
      )}
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
