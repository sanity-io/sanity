import type {Subscription} from 'rxjs'
import React, {useState, useEffect, useRef, useCallback} from 'react'
import styled from 'styled-components'
import {Button, Card, useToast} from '@sanity/ui'
import {Asset as AssetType} from '@sanity/types'
import {useClient} from '../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {FullscreenSpinner} from '../../components/FullscreenSpinner'
import {AssetUsageDialog} from './AssetUsageDialog'
import {AssetMenu} from './AssetMenu'
import {AssetMenuAction} from './types'

interface AssetProps {
  asset: AssetType
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

const Container = styled(Card)`
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
  top: 3px;
  right: 3px;

  & button[data-selected] {
    display: block;
  }

  @media (hover: hover) {
    // If hover is supported, hide the buttons until the user hovers or focuses the asset
    // Use opacity to enable the buttons to still be focusable
    & button {
      opacity: 0;
    }

    ${Root}:hover & {
      button {
        opacity: 1;
      }
    }

    ${Root}:focus-within & {
      button {
        opacity: 1;
      }
    }
  }
`

export const AssetThumb = React.memo(function AssetThumb(props: AssetProps) {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteDialog(true)
  }, [setShowDeleteDialog])

  const handleDialogClose = useCallback(() => {
    setShowUsageDialog(false)
    setShowDeleteDialog(false)
  }, [setShowUsageDialog, setShowDeleteDialog])

  const handleToggleUsageDialog = useCallback(() => {
    setShowUsageDialog(true)
  }, [setShowUsageDialog])

  const handleDeleteError = useCallback(
    (error: any) => {
      toast.push({
        closable: true,
        status: 'error',
        title: 'Image could not be deleted',
        description: error.message,
      })
    },
    [toast],
  )

  const handleDeleteSuccess = useCallback(() => {
    toast.push({
      status: 'success',
      title: 'Image was deleted',
    })
  }, [toast])

  const handleDeleteAsset = useCallback(() => {
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
  }, [
    asset._id,
    handleDeleteError,
    handleDeleteSuccess,
    onDeleteFinished,
    versionedClient.observable,
  ])

  const handleMenuAction = useCallback(
    (action: AssetMenuAction) => {
      if (action.type === 'delete') {
        handleConfirmDelete()
      }

      if (action.type === 'showUsage') {
        handleToggleUsageDialog()
      }
    },
    [handleConfirmDelete, handleToggleUsageDialog],
  )

  // const {asset, onClick, onKeyPress, isSelected} = props
  const {originalFilename, _id, url} = asset
  const imgH = 200 * Math.max(1, DPI)

  // Mead can't convert gifs, so we might end up with large gifs that will cause the source window to use a lot of CPU
  // We instead force them to display as jpgs
  const imageUrl = url.includes('.gif')
    ? `${url}?h=${imgH}&fit=max&fm=jpg`
    : `${url}?h=${imgH}&fit=max`

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
        <Container __unstable_checkered>
          <Image alt={originalFilename} src={imageUrl} onClick={onClick} data-id={_id} />
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
})
