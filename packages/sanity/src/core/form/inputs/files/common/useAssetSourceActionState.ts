import {type Asset, type AssetSource, type AssetSourceComponentAction} from '@sanity/types'
import {useCallback, useState} from 'react'

/**
 * Shared state and handlers for the asset source dialog (select, upload, openInSource).
 * Each user action explicitly sets the action—no defaulting.
 * Owns isUploading and isStale (driven by upload flow and UploadProgress).
 *
 * @internal
 */
export function useAssetSourceActionState<T = Asset>() {
  const [action, setAction] = useState<AssetSourceComponentAction>()
  const [selectedAssetSource, setSelectedAssetSource] = useState<AssetSource | null>(null)
  const [openInSourceAsset, setOpenInSourceAsset] = useState<T | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isStale, setIsStale] = useState(false)

  const openForBrowse = useCallback((assetSource: AssetSource) => {
    setAction('select')
    setSelectedAssetSource(assetSource)
  }, [])

  const openForUpload = useCallback((assetSource: AssetSource) => {
    setAction('upload')
    setSelectedAssetSource(assetSource)
    setIsUploading(true)
  }, [])

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
    setIsStale(false)
    setAction(undefined)
  }, [])

  const close = useCallback(() => {
    resetOnComplete()
  }, [resetOnComplete])

  const onStale = useCallback(() => setIsStale(true), [])

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
    isUploading,
    setIsUploading,
    isStale,
    setIsStale,
    onStale,
  }
}
