import React from 'react'
import {DownloadIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {AssetFromSource} from '@sanity/types'
import {uniqueId} from 'lodash'
import {client} from '../../legacyParts'
import Asset from './Asset'

const PER_PAGE = 200

interface AssetType {
  _id: string
  url: string
}

interface Props {
  onSelect: (arg0: AssetFromSource[]) => void
  onClose: () => void
  selectedAssets: AssetType[]
  selectionType: boolean
}

const buildQuery = (start = 0, end = PER_PAGE) => `
  *[_type == "sanity.imageAsset"] | order(_updatedAt desc) [${start}...${end}] {
    _id,
    url,
    metadata {dimensions}
  }
`

type State = {
  assets: Array<AssetType>
  isLastPage: boolean
  isLoading: boolean
}

export class DefaultSource extends React.Component<Props, State> {
  state = {
    assets: [],
    isLastPage: false,
    isLoading: false,
  }

  _elementId = `default-asset-source-${uniqueId()}`

  pageNo = 0

  fetchPage(pageNo: number) {
    const start = pageNo * PER_PAGE
    const end = start + PER_PAGE

    this.setState({isLoading: true})

    return client.fetch(buildQuery(start, end)).then((result) => {
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

  render() {
    const {selectedAssets} = this.props
    const {assets, isLastPage, isLoading} = this.state

    return (
      <Dialog
        id={this._elementId}
        header="Select image"
        width={2}
        position="absolute"
        onClose={this.handleClose}
      >
        <Box padding={4}>
          <Grid gap={2} style={{gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))'}}>
            {assets.map((asset) => (
              <Asset
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

        {assets.length > 0 && !isLastPage && (
          <Stack padding={4} style={{borderTop: '1px solid var(--card-border-color)'}}>
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
