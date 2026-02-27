import {type Asset, type AssetSource, type AssetSourceComponentAction} from '@sanity/types'
import {useCallback, useState} from 'react'

/**
 * Shared state and handlers for the asset source dialog (select, upload, openInSource).
 * Each user action explicitly sets the action—no defaulting.
 *
 * @internal
 */
export function useAssetSourceActionState<T = Asset>(options: {
  setIsUploading: (uploading: boolean) => void
}) {
  const {setIsUploading} = options

  const [action, setAction] = useState<AssetSourceComponentAction>()
  const [selectedAssetSource, setSelectedAssetSource] = useState<AssetSource | null>(null)
  const [openInSourceAsset, setOpenInSourceAsset] = useState<T | null>(null)

  const openForBrowse = useCallback((assetSource: AssetSource) => {
    setAction('select')
    setSelectedAssetSource(assetSource)
  }, [])

  const openForUpload = useCallback(
    (assetSource: AssetSource) => {
      setAction('upload')
      setSelectedAssetSource(assetSource)
      setIsUploading(true)
    },
    [setIsUploading],
  )

  const openInSource = useCallback((assetSource: AssetSource, asset: T) => {
    setAction('openInSource')
    setSelectedAssetSource(assetSource)
    setOpenInSourceAsset(asset)
  }, [])

  const changeAction = useCallback((newAction: AssetSourceComponentAction) => {
    setAction(newAction)
    setOpenInSourceAsset(null)
  }, [])

  const resetOnComplete = useCallback(() => {
    setSelectedAssetSource(null)
    setOpenInSourceAsset(null)
    setIsUploading(false)
    setAction(undefined)
  }, [setIsUploading])

  const close = useCallback(() => {
    resetOnComplete()
  }, [resetOnComplete])

  return {
    action,
    selectedAssetSource,
    openInSourceAsset,
    setOpenInSourceAsset,
    setSelectedAssetSource,
    openForBrowse,
    openForUpload,
    openInSource,
    changeAction,
    close,
    resetOnComplete,
  }
}
