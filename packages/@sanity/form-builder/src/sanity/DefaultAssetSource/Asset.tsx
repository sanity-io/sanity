import type {Subscription} from 'rxjs'
import React from 'react'
import styled from 'styled-components'
import {Button, Card, Flex, Stack, Heading, Text} from '@sanity/ui'
import {DocumentIcon} from '@sanity/icons'
import {FullscreenSpinner} from '../../components/FullscreenSpinner'
import {AssetRecord} from '../../inputs/files/ImageInput/types'
import {versionedClient} from '../versionedClient'
import {Checkerboard} from '../../components/Checkerboard'
import {AssetUsageDialog} from './AssetUsageDialog'
import {AssetMenu} from './AssetMenu'
import {AssetDialogAction, AssetMenuAction} from './types'
import {DeleteAssetErrorDialog} from './DeleteAssetErrorDialog'

interface AssetProps {
  assetType?: 'image' | 'file'
  asset?: AssetRecord
  isSelected: boolean
  onClick?: (...args: any[]) => any
  onKeyPress?: (...args: any[]) => any
  onDeleteFinished: (...args: any[]) => any
}

interface State {
  isDeleting: boolean
  showUsageDialog: boolean
  deleteError: Error | null
}

// Get pixel density of the current device
const DPI =
  typeof window === 'undefined' || !window.devicePixelRatio
    ? 1
    : Math.round(window.devicePixelRatio)

const Image = styled.img`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
`

const Container = styled(Checkerboard)`
  position: relative;
  z-index: 1;
  padding-bottom: 100%;
`

const AbsoluteFlex = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

const CardContainer = styled(Card)`
  position: relative;
  z-index: 1;
  padding-bottom: 100%;
`

const Root = styled.div`
  position: relative;
  display: inherit;
`

const MenuContainer = styled.div`
  box-sizing: border-box;
  position: absolute;
  z-index: 2;
  display: none;
  top: 3px;
  right: 3px;

  ${Root}:hover & {
    display: block;
  }
`

export default class Asset extends React.PureComponent<AssetProps, State> {
  state: State = {
    isDeleting: false,
    showUsageDialog: false,
    deleteError: null,
  }

  delete$: Subscription

  componentWillUnmount() {
    if (this.delete$) {
      this.delete$.unsubscribe()
    }
  }

  handleDeleteAsset = () => {
    const {onDeleteFinished, asset} = this.props

    this.setState({isDeleting: true})

    this.delete$ = versionedClient.observable.delete(asset._id).subscribe({
      next: () => {
        this.setState({isDeleting: false})
        onDeleteFinished(asset._id)
      },
      error: (err: Error) => {
        this.setState({isDeleting: false, deleteError: err})
        // eslint-disable-next-line no-console
        console.error('Could not delete asset', err)
      },
    })
  }

  handleDialogClose = () => {
    this.setState({showUsageDialog: false, deleteError: null})
  }

  handleMenuAction = (action: AssetMenuAction) => {
    if (action.type === 'delete') {
      this.handleDeleteAsset()
    }

    if (action.type === 'showUsage') {
      this.setState({showUsageDialog: true})
    }
  }

  handleDialogAction = (action: AssetDialogAction) => {
    if (action.type === 'close') {
      this.handleDialogClose()
    }

    if (action.type === 'delete') {
      this.handleDeleteAsset()
    }
  }

  render() {
    const {asset, assetType = 'image', onClick, onKeyPress, isSelected} = this.props
    const {originalFilename, _id, mimeType, extension, url} = asset
    const {isDeleting, showUsageDialog, deleteError} = this.state
    const imgH = 200 * Math.max(1, DPI)
    const isImageType = assetType === 'image'
    const isImageMimetype = mimeType.includes('image')
    const isPreviewable = isImageMimetype && !['heic', 'ico'].includes(extension)

    return (
      <Root>
        <Button
          tone="primary"
          selected={isSelected}
          tabIndex={0}
          data-id={_id}
          mode="ghost"
          onKeyPress={onKeyPress}
          padding={0}
          style={{padding: 2}}
        >
          {isImageType && (
            <Container>
              <Image
                alt={originalFilename}
                src={`${url}?h=${imgH}&fit=max`}
                onClick={onClick}
                data-id={_id}
              />
              {isDeleting && <FullscreenSpinner />}
            </Container>
          )}
          {!isImageType && (
            <CardContainer radius={2} tone="transparent">
              {isPreviewable && (
                <Image
                  alt={originalFilename}
                  src={`${url}?h=${imgH}&fit=max`}
                  onClick={onClick}
                  data-id={_id}
                />
              )}
              {!isPreviewable && (
                <AbsoluteFlex
                  title={originalFilename}
                  onClick={onClick}
                  data-id={_id}
                  align="center"
                  justify="center"
                  padding={3}
                >
                  <Stack space={3}>
                    <Heading align="center">
                      <DocumentIcon />
                    </Heading>
                    <Text align="center" size={1} textOverflow="ellipsis">
                      {originalFilename}
                    </Text>
                  </Stack>
                </AbsoluteFlex>
              )}
              {isDeleting && <FullscreenSpinner />}
            </CardContainer>
          )}
        </Button>
        <MenuContainer>
          <AssetMenu isSelected={isSelected} onAction={this.handleMenuAction} />
        </MenuContainer>
        {showUsageDialog && (
          <AssetUsageDialog
            asset={asset}
            onClose={this.handleDialogClose}
            onDelete={this.handleDeleteAsset}
          />
        )}
        {deleteError && (
          <DeleteAssetErrorDialog
            asset={asset}
            onClose={this.handleDialogClose}
            error={deleteError}
          />
        )}
      </Root>
    )
  }
}
