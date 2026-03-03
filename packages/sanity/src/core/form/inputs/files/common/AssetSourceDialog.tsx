import {
  type Asset,
  type AssetFromSource,
  type AssetSource,
  type AssetSourceComponentAction,
  type AssetSourceUploader,
  type FileSchemaType,
  type ImageSchemaType,
  type Reference,
} from '@sanity/types'
import get from 'lodash-es/get.js'
import {type ReactNode, useCallback, useMemo} from 'react'
import {type Observable} from 'rxjs'

import {type VideoSchemaType} from '../../../../../media-library/plugin/schemas/types'
import {useTranslation} from '../../../../i18n'
import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'

export type AssetSourceDialogAssetType = 'file' | 'image' | 'sanity.video'

const DIALOG_TITLE_KEYS: Record<AssetSourceDialogAssetType, string> = {
  'file': 'inputs.files.select-dialog.title',
  'image': 'inputs.image.select-dialog.title',
  'sanity.video': 'inputs.video.select-dialog.title',
}

const DEFAULT_ACCEPT: Record<AssetSourceDialogAssetType, string> = {
  'file': '',
  'image': 'image/*',
  'sanity.video': 'video/*',
}

export interface AssetSourceDialogProps<
  TAsset extends Asset = Asset,
  TSchemaType extends FileSchemaType | ImageSchemaType | VideoSchemaType =
    | FileSchemaType
    | ImageSchemaType
    | VideoSchemaType,
> {
  action: AssetSourceComponentAction
  assetType: AssetSourceDialogAssetType
  onClose: () => void
  onChangeAction: (action: AssetSourceComponentAction) => void
  onSelect: (assets: AssetFromSource[]) => void
  openInSourceAsset?: TAsset | null
  schemaType?: TSchemaType
  selectedAssetSource: AssetSource
  accept?: string
  observeAsset?: (assetId: string) => Observable<TAsset>
  value?: {asset?: Reference}
  uploader?: AssetSourceUploader
  /** Shown while loading the referenced asset. Used for file and video types. */
  waitPlaceholder?: ReactNode
}

/**
 * Shared dialog component for rendering asset source plugins (select, upload, openInSource).
 * Used by File, Image, and Video inputs.
 *
 * @internal
 */
export function AssetSourceDialog<
  TAsset extends Asset = Asset,
  TSchemaType extends FileSchemaType | ImageSchemaType | VideoSchemaType =
    | FileSchemaType
    | ImageSchemaType
    | VideoSchemaType,
>(props: AssetSourceDialogProps<TAsset, TSchemaType>) {
  const {
    action,
    assetType,
    observeAsset,
    onClose,
    onChangeAction,
    onSelect,
    openInSourceAsset,
    schemaType,
    selectedAssetSource,
    value,
    uploader,
  } = props

  const {t} = useTranslation()

  const accept = useMemo(
    () => props.accept ?? get(schemaType, 'options.accept', DEFAULT_ACCEPT[assetType]),
    [props.accept, assetType, schemaType],
  )

  const dialogHeaderTitle = useMemo(
    () =>
      t(DIALOG_TITLE_KEYS[assetType], {
        targetTitle: schemaType?.title,
      }),
    [assetType, schemaType?.title, t],
  )

  const {waitPlaceholder} = props

  const Component = selectedAssetSource.component

  const commonProps = useMemo(
    () => ({
      accept,
      action,
      assetSource: selectedAssetSource,
      assetToOpen: openInSourceAsset || undefined,
      assetType,
      dialogHeaderTitle,
      onChangeAction,
      onClose,
      onSelect,
      schemaType,
      selectionType: 'single' as const,
      uploader,
    }),
    [
      accept,
      action,
      selectedAssetSource,
      openInSourceAsset,
      assetType,
      dialogHeaderTitle,
      onChangeAction,
      onClose,
      onSelect,
      schemaType,
      uploader,
    ],
  )

  const renderWithAsset = useCallback(
    (asset: TAsset) => <Component {...commonProps} selectedAssets={[asset as Asset]} />,
    [Component, commonProps],
  )

  const renderWithoutAsset = useCallback(
    () => <Component {...commonProps} selectedAssets={[]} />,
    [Component, commonProps],
  )

  // When action is 'select', we're opening the picker to choose a new asset. Skip loading the
  // current asset—many asset sources (e.g. Media Library) don't need it, and media-library refs
  // can't be observed via documentPreviewStore, so loading would hang on the skeleton.
  if (value?.asset && observeAsset && action !== 'select') {
    return (
      <WithReferencedAsset
        observeAsset={observeAsset}
        reference={value.asset}
        waitPlaceholder={waitPlaceholder}
      >
        {renderWithAsset}
      </WithReferencedAsset>
    )
  }

  return renderWithoutAsset()
}
