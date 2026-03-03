import {ChevronDownIcon, UploadIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {Menu} from '@sanity/ui'
import uniqueId from 'lodash-es/uniqueId.js'
import {type ForwardedRef, forwardRef, memo, useCallback, useMemo} from 'react'

import {
  Button,
  MenuButton,
  type MenuButtonProps,
  MenuGroup,
  type MenuGroupProps,
  MenuItem,
} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {getAssetSourceDisplayName, isComponentModeAssetSource} from './assetSourceUtils'
import {openFilePicker} from './openFilePicker'

const UPLOAD_DROP_DOWN_MENU_POPOVER: MenuButtonProps['popover'] = {portal: true} as const
const MENU_GROUP_POPOVER: MenuGroupProps['popover'] = {
  placement: 'right-start',
  fallbackPlacements: ['left-start', 'bottom', 'top'],
}
const ASSET_SOURCE_DATA_ATTRIBUTE = 'data-asset-source-name'

interface UploadDropDownButtonComponentProps {
  'accept'?: string
  'assetSources': AssetSource[]
  'capture'?: 'user' | 'environment'
  'directUploads'?: boolean
  'multiple'?: boolean
  'onSelectFiles'?: (assetSource: AssetSource, files: File[]) => void
  /**
   * Called when an asset source with `uploadMode: 'component'` is selected.
   * The source should be rendered directly to handle file selection and upload internally.
   */
  'onOpenSourceForUpload'?: (assetSource: AssetSource) => void
  /**
   * Called when any item in the upload submenu is clicked (before the action).
   * Use this to close the parent menu so both submenu and main menu close.
   */
  'onCloseParentMenu'?: () => void
  /** Called when the user cancels the native file picker. */
  'onFilePickerCancel'?: () => void
  'readOnly'?: boolean
  'renderAsMenuGroup'?: boolean
  'data-testid'?: string
}

function UploadDropDownMenuComponent(
  props: UploadDropDownButtonComponentProps,
  forwardedRef: ForwardedRef<HTMLButtonElement>,
) {
  const {
    accept,
    assetSources,
    capture,
    directUploads,
    multiple,
    onSelectFiles,
    onOpenSourceForUpload,
    onCloseParentMenu,
    onFilePickerCancel,
    readOnly,
    renderAsMenuGroup = false,
    'data-testid': dataTestId,
  } = props
  const {t} = useTranslation()

  const uniqId = useMemo(() => uniqueId(), [])
  const uploadsDisabled = readOnly || directUploads === false

  const createAssetSourceInputId = useCallback(
    (assetSource: AssetSource) => {
      return `${uniqId}-${assetSource.name}-upload-button`
    },
    [uniqId],
  )

  const openFilePickerForAssetSource = useCallback(
    (assetSource: AssetSource) => {
      openFilePicker({
        accept,
        capture,
        multiple,
        onSelect: (files) => {
          onSelectFiles?.(assetSource, files)
        },
        onCancel: onFilePickerCancel,
      })
    },
    [accept, capture, multiple, onSelectFiles, onFilePickerCancel],
  )

  // Needed for keyboard navigation (arrow keys + enter/space)
  const handleMenuItemClick = useCallback(
    (event: React.MouseEvent) => {
      const assetSourceName = event.currentTarget.getAttribute(ASSET_SOURCE_DATA_ATTRIBUTE)
      const assetSource = assetSources.find((source) => source.name === assetSourceName)
      if (!assetSource) {
        return
      }
      // Close parent menu so both submenu and main menu close
      onCloseParentMenu?.()
      if (isComponentModeAssetSource(assetSource)) {
        if (onOpenSourceForUpload) {
          onOpenSourceForUpload(assetSource)
        }
        return
      }
      // For picker mode: create file input in body (outside menu) so it persists after menu closes
      openFilePickerForAssetSource(assetSource)
    },
    [assetSources, onCloseParentMenu, onOpenSourceForUpload, openFilePickerForAssetSource],
  )

  const renderMenuItemForAssetSource = useCallback(
    (assetSource: AssetSource, index: number) => {
      const inputId = createAssetSourceInputId(assetSource)
      const isDefaultSource = assetSource.name === assetSources[0].name
      const isComponentMode = isComponentModeAssetSource(assetSource)
      return (
        <MenuItem
          key={`${inputId}-menu-button`}
          {...{[ASSET_SOURCE_DATA_ATTRIBUTE]: assetSource.name}}
          badgeText={
            isDefaultSource
              ? t('input.files.common.upload-placeholder.file-input-button.default-source.badge')
              : undefined
          }
          data-testid={`file-input-upload-button-${index}`}
          disabled={uploadsDisabled}
          icon={assetSource.icon}
          onClick={handleMenuItemClick}
          text={getAssetSourceDisplayName(assetSource, t, {useStartCaseForName: true})}
        />
      )
    },
    [assetSources, createAssetSourceInputId, handleMenuItemClick, t, uploadsDisabled],
  )

  if (assetSources && assetSources.length > 1) {
    const menuItems = assetSources.map((assetSource, index) =>
      renderMenuItemForAssetSource(assetSource, index),
    )
    if (renderAsMenuGroup) {
      return (
        <MenuGroup
          data-testid={dataTestId}
          icon={UploadIcon}
          text={t('input.files.common.upload-placeholder.file-input-button.text')}
          popover={MENU_GROUP_POPOVER}
        >
          {menuItems}
        </MenuGroup>
      )
    }
    return (
      <MenuButton
        id={`${uniqId}_upload-button`}
        ref={forwardedRef}
        button={
          <Button
            data-testid="file-input-upload-button-0"
            icon={UploadIcon}
            iconRight={ChevronDownIcon}
            mode="bleed"
            disabled={uploadsDisabled}
            text={t('input.files.common.upload-placeholder.file-input-button.text')}
          />
        }
        menu={<Menu>{menuItems}</Menu>}
        popover={UPLOAD_DROP_DOWN_MENU_POPOVER}
      />
    )
  }

  return null
}
export const UploadDropDownMenu = memo(forwardRef(UploadDropDownMenuComponent))
