import {UploadIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {type ReactNode, useMemo} from 'react'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {isComponentModeAssetSource} from './assetSourceUtils'
import {FileInputMenuItem} from './FileInputMenuItem/FileInputMenuItem'
import {UploadDropDownMenu} from './UploadDropDownMenu'

export interface UseUploadMenuItemOptions {
  accept: string
  assetSourcesWithUpload: AssetSource[]
  directUploads?: boolean
  readOnly?: boolean
  onSelectFiles: (assetSource: AssetSource, files: File[]) => void
  onOpenSourceForUpload?: (assetSource: AssetSource) => void
  /** Called when single source in component mode is clicked. Pass pre-wrapped handler (e.g. with menu close). */
  onOpenSourceForUploadSingle?: () => void
  /** Called when files are selected from single picker source. Pass pre-wrapped handler (e.g. with menu close). */
  onSelectFilesSingle?: (files: File[]) => void
  /** Optional test ID for single button: (sourceName) =\> string. Omit for no data-testid. */
  getSingleButtonTestId?: (sourceName: string) => string | undefined
  /** Optional test ID for the upload dropdown when multiple sources. Omit for no data-testid. */
  dropdownMenuTestId?: string
  /**
   * Called when any item in the upload submenu is clicked (multiple sources only).
   * Use to close the parent menu so both submenu and main menu close.
   */
  onCloseParentMenu?: () => void
  /** Called when the user cancels the native file picker. Use to restore focus. */
  onFilePickerCancel?: () => void
}

/**
 * Shared hook for rendering upload menu item(s) in FileInput, ImageInput, and VideoInput.
 * Returns a ReactNode for use in ActionsMenu.
 *
 * @internal
 */
export function useUploadMenuItem(options: UseUploadMenuItemOptions): ReactNode {
  const {
    accept,
    assetSourcesWithUpload,
    directUploads,
    readOnly,
    onSelectFiles,
    onOpenSourceForUpload,
    onOpenSourceForUploadSingle,
    onSelectFilesSingle,
    getSingleButtonTestId,
    dropdownMenuTestId,
    onCloseParentMenu,
    onFilePickerCancel,
  } = options

  const {t} = useTranslation()

  return useMemo(() => {
    switch (assetSourcesWithUpload.length) {
      case 0:
        return null
      case 1: {
        const singleSource = assetSourcesWithUpload[0]
        const singleButtonTestId = getSingleButtonTestId?.(singleSource.name)
        const disabled = readOnly || directUploads === false

        if (isComponentModeAssetSource(singleSource)) {
          return (
            <MenuItem
              icon={UploadIcon}
              onClick={onOpenSourceForUploadSingle}
              data-asset-source-name={singleSource.name}
              text={t('inputs.files.common.actions-menu.upload.label')}
              data-testid={singleButtonTestId}
              disabled={disabled}
            />
          )
        }
        return (
          <FileInputMenuItem
            icon={UploadIcon}
            onSelect={onSelectFilesSingle}
            onFilePickerCancel={onFilePickerCancel}
            accept={accept}
            data-asset-source-name={singleSource.name}
            text={t('inputs.files.common.actions-menu.upload.label')}
            data-testid={singleButtonTestId}
            disabled={disabled}
          />
        )
      }
      default:
        return (
          <UploadDropDownMenu
            accept={accept}
            assetSources={assetSourcesWithUpload}
            directUploads={directUploads}
            onSelectFiles={onSelectFiles}
            onOpenSourceForUpload={onOpenSourceForUpload}
            onCloseParentMenu={onCloseParentMenu}
            onFilePickerCancel={onFilePickerCancel}
            readOnly={readOnly}
            data-testid={dropdownMenuTestId}
            renderAsMenuGroup
          />
        )
    }
  }, [
    accept,
    assetSourcesWithUpload,
    directUploads,
    dropdownMenuTestId,
    getSingleButtonTestId,
    onCloseParentMenu,
    onFilePickerCancel,
    onOpenSourceForUpload,
    onOpenSourceForUploadSingle,
    onSelectFiles,
    onSelectFilesSingle,
    readOnly,
    t,
  ])
}
