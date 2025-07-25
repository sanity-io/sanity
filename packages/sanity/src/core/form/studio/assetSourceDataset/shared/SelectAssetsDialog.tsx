import {DownloadIcon, InfoOutlineIcon} from '@sanity/icons'
import {type Asset, type AssetFromSource, type AssetSourceComponentProps} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {uniqueId} from 'lodash'
import {
  type ForwardedRef,
  forwardRef,
  type KeyboardEvent,
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type Subscription} from 'rxjs'
import {styled} from 'styled-components'

import {Button, Dialog} from '../../../../../ui-components'
import {useClient, useListFormat} from '../../../../hooks'
import {Translate, useTranslation} from '../../../../i18n'
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

const SelectAssetsComponent = function SelectAssetsComponent(
  props: AssetSourceComponentProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const versionedClient = useMemo(() => client.withConfig({apiVersion: '2023-02-14'}), [client])
  const [_elementId] = useState(() => `default-asset-source-${uniqueId()}`)
  const currentPageNumber = useRef(0)
  const {t} = useTranslation()
  const fetch$ = useRef<Subscription>(undefined)
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLastPage, setIsLastPage] = useState(false)
  const [hasResetAutoFocus, setHasResetFocus] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const {selectedAssets, assetType = 'image', dialogHeaderTitle, onClose, onSelect, accept} = props

  const isImageOnlyWildCard = accept && accept === 'image/*' && assetType === 'image'
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
    (event: MouseEvent) => {
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
    (event: KeyboardEvent) => {
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
    (event: MouseEvent) => {
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

  const listFormat = useListFormat({style: 'narrow'})

  return (
    <Dialog
      __unstable_autoFocus={hasResetAutoFocus}
      header={
        dialogHeaderTitle ||
        t('asset-source.dialog.default-title', {
          context: assetType,
        })
      }
      id={_elementId}
      onClickOutside={handleClose}
      onClose={handleClose}
      ref={ref}
      width={2}
    >
      <Stack space={5}>
        {!isImageOnlyWildCard && !isLoading && accept?.length > 0 && (
          <Card tone="primary" padding={3} border radius={2}>
            <Flex gap={3} align="center">
              <Text size={1}>
                <InfoOutlineIcon />
              </Text>
              <Text size={1}>
                <Translate
                  t={t}
                  i18nKey="asset-source.dialog.accept-message"
                  values={{
                    acceptTypes: listFormat.format(accept.split(',').map((type) => type.trim())),
                  }}
                />
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
                size="large"
                text={t('asset-source.dialog.load-more')}
                tone="primary"
              />
            </Flex>
          </CardLoadMore>
        )}
      </Stack>
    </Dialog>
  )
}

export const SelectAssetsDialog = memo(forwardRef(SelectAssetsComponent))
