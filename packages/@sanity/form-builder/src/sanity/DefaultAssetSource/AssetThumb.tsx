import type {Subscription} from 'rxjs'
import React, {useState, useEffect, useRef} from 'react'
import styled from 'styled-components'
import {Button, useToast} from '@sanity/ui'
import {Asset as AssetType} from '@sanity/types'
import {FullscreenSpinner} from '../../components/FullscreenSpinner'
import {versionedClient} from '../versionedClient'
import {Checkerboard} from '../../components/Checkerboard'
import {AssetUsageDialog} from './AssetUsageDialog'
import {AssetMenu} from './AssetMenu'
import {AssetMenuAction} from './types'

interface AssetProps {
  asset?: AssetType
  isSelected: boolean
  onClick?: (...args: any[]) => any
  onKeyPress?: (...args: any[]) => any
  onDeleteFinished: (...args: any[]) => any
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

const AssetThumb = (props: AssetProps) => {
  const toast = useToast()
  const deleteRef$ = useRef<Subscription>()
  const {asset, onClick, onKeyPress, onDeleteFinished, isSelected} = props
  const [showUsageDialog, setShowUsageDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    return () => {
      if (deleteRef$.current) {
        deleteRef$.current.unsubscribe()
      }
    }
  }, [])

  const handleConfirmDelete = () => {
    setShowDeleteDialog(true)
  }

  const handleDialogClose = () => {
    setShowUsageDialog(false)
    setShowDeleteDialog(false)
  }

  const handleToggleUsageDialog = () => {
    setShowUsageDialog(true)
  }

  const handleDeleteError = (error) => {
    toast.push({
      closable: true,
      status: 'error',
      title: 'Image could not be deleted',
      description: error.message,
    })
  }

  const handleDeleteSuccess = () => {
    toast.push({
      status: 'success',
      title: 'Image was deleted',
    })
  }

  const handleDeleteAsset = () => {
    setIsDeleting(true)

    deleteRef$.current = versionedClient.observable.delete(asset._id).subscribe({
      next: () => {
        setIsDeleting(false)
        onDeleteFinished(asset._id)
        setShowDeleteDialog(false)
        handleDeleteSuccess()
      },
      error: (err: Error) => {
        setIsDeleting(false)
        handleDeleteError(err)
        // eslint-disable-next-line no-console
        console.error('Could not delete asset', err)
      },
    })
  }

  const handleMenuAction = (action: AssetMenuAction) => {
    if (action.type === 'delete') {
      handleConfirmDelete()
    }

    if (action.type === 'showUsage') {
      handleToggleUsageDialog()
    }
  }

  // const {asset, onClick, onKeyPress, isSelected} = props
  const {originalFilename, _id, url} = asset
  const imgH = 200 * Math.max(1, DPI)

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
        <Container>
          <Image
            alt={originalFilename}
            src={`${url}?h=${imgH}&fit=max`}
            onClick={onClick}
            data-id={_id}
          />
          {isDeleting && <FullscreenSpinner />}
        </Container>
      </Button>
      <MenuContainer>
        <AssetMenu isSelected={isSelected} onAction={handleMenuAction} />
      </MenuContainer>
      {(showUsageDialog || showDeleteDialog) && (
        <AssetUsageDialog
          asset={asset}
          mode={showDeleteDialog ? 'confirmDelete' : 'listUsage'}
          onClose={handleDialogClose}
          onDelete={handleDeleteAsset}
          isDeleting={isDeleting}
        />
      )}
    </Root>
  )
}

export default AssetThumb
