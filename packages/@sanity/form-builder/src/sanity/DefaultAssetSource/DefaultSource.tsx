import type {Subscription} from 'rxjs'
import React from 'react'
import {DownloadIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {AssetFromSource, Asset as AssetType} from '@sanity/types'
import {uniqueId} from 'lodash'
import {versionedClient} from '../versionedClient'
import AssetThumb from './AssetThumb'
import TableList from './TableList'

const PER_PAGE = 200
const ASSET_TYPE_IMAGE = 'sanity.imageAsset'
const ASSET_TYPE_FILE = 'sanity.fileAsset'

interface Props {
  onSelect: (arg0: AssetFromSource[]) => void
  onClose: () => void
  selectedAssets: AssetType[]
  assetType: 'file' | 'image'
  selectionType: boolean
  dialogHeaderTitle?: string
}

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

type State = {
  assets: AssetType[]
  isLastPage: boolean
  isLoading: boolean
}

const STYLES_THUMB_GRID = {gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))'}
const STYLES_LOAD_MORE_BUTTON = {borderTop: '1px solid var(--card-border-color)'}

export class DefaultSource extends React.PureComponent<Props, State> {
  state = {
    assets: [],
    isLastPage: false,
    isLoading: false,
  }

  _elementId = `default-asset-source-${uniqueId()}`

  pageNo = 0
  fetch$: Subscription

  fetchPage(pageNo: number) {
    const {assetType = 'image'} = this.props
    const start = pageNo * PER_PAGE
    const end = start + PER_PAGE
    const isImageAssetType = assetType === 'image'
    const tag = isImageAssetType ? 'asset.image-list' : 'asset.file-list'
    const assetTypeParam = isImageAssetType ? ASSET_TYPE_IMAGE : ASSET_TYPE_FILE

    this.setState({isLoading: true})

    this.fetch$ = versionedClient.observable
      .fetch(buildQuery(start, end, assetTypeParam), {}, {tag})
      .subscribe((result) => {
        this.setState((prevState) => ({
          isLastPage: result.length < PER_PAGE,
          assets: prevState.assets.concat(result),
          isLoading: false,
        }))
      })
  }

  handleDeleteFinished = (id) => {
    this.setState((prevState) => ({
      assets: prevState.assets.filter((asset) => asset._id !== id),
    }))
  }

  componentDidMount() {
    this.fetchPage(this.pageNo)
  }

  componentWillUnmount() {
    if (this.fetch$) {
      this.fetch$.unsubscribe()
    }
  }

  select(id) {
    const selected = this.state.assets.find((doc) => doc._id === id)

    if (selected) {
      this.props.onSelect([{kind: 'assetDocumentId', value: id}])
    }
  }

  handleItemClick = (event: React.MouseEvent) => {
    event.preventDefault()

    this.select(event.currentTarget.getAttribute('data-id'))
  }

  handleItemKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.select(event.currentTarget.getAttribute('data-id'))
    }
  }

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  handleFetchNextPage = () => {
    this.fetchPage(++this.pageNo)
  }

  renderThumbView() {
    const {assetType = 'image', selectedAssets} = this.props
    const {assets, isLoading} = this.state

    return (
      <Box padding={4}>
        <Grid gap={2} style={STYLES_THUMB_GRID}>
          {assets.map((asset) => (
            <AssetThumb
              assetType={assetType}
              key={asset._id}
              asset={asset}
              isSelected={selectedAssets.some((selected) => selected._id === asset._id)}
              onClick={this.handleItemClick}
              onKeyPress={this.handleItemKeyPress}
              onDeleteFinished={this.handleDeleteFinished}
            />
          ))}
        </Grid>

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
  }

  renderTableView() {
    const {selectedAssets} = this.props
    const {assets, isLoading} = this.state

    return (
      <TableList
        isLoading={isLoading}
        assets={assets}
        selectedAssets={selectedAssets}
        onClick={this.handleItemClick}
        onKeyPress={this.handleItemKeyPress}
        onDeleteFinished={this.handleDeleteFinished}
      />
    )
  }

  render() {
    const {assetType = 'image', dialogHeaderTitle = 'Select image'} = this.props
    const {assets, isLastPage, isLoading} = this.state

    return (
      <Dialog id={this._elementId} header={dialogHeaderTitle} width={2} onClose={this.handleClose}>
        {assetType === 'image' && this.renderThumbView()}
        {assetType === 'file' && this.renderTableView()}

        {assets.length > 0 && !isLastPage && (
          <Stack padding={4} style={STYLES_LOAD_MORE_BUTTON}>
            <Button
              icon={DownloadIcon}
              loading={isLoading}
              onClick={this.handleFetchNextPage}
              text="Load more"
              tone="primary"
            />
          </Stack>
        )}
      </Dialog>
    )
  }
}
