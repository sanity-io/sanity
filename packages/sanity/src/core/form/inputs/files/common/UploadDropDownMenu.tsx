import {ChevronDownIcon, UploadIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {Menu} from '@sanity/ui'
import uniqueId from 'lodash-es/uniqueId.js'
import {type ChangeEvent, type ForwardedRef, forwardRef, memo, useCallback, useMemo} from 'react'

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

const UPLOAD_DROP_DOWN_MENU_POPOVER: MenuButtonProps['popover'] = {portal: true} as const
const MENU_GROUP_POPOVER: MenuGroupProps['popover'] = {
  placement: 'right-start',
  fallbackPlacements: ['left-start', 'bottom', 'top'],
}
const ASSET_SOURCE_DATA_ATTRIBUTE = 'data-asset-source-name'

interface UploadDropDownButtonComponentProps {
  accept?: string
  assetSources: AssetSource[]
  capture?: 'user' | 'environment'
  directUploads?: boolean
  multiple?: boolean
  onSelectFiles?: (assetSource: AssetSource, files: File[]) => void
  /**
   * Called when an asset source with `uploadMode: 'component'` is selected.
   * The source should be rendered directly to handle file selection and upload internally.
   */
  onOpenSourceForUpload?: (assetSource: AssetSource) => void
  readOnly?: boolean
  renderAsMenuGroup?: boolean
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
    readOnly,
    renderAsMenuGroup = false,
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

  // Needed for keyboard navigation (arrow keys + enter/space)
  const handleMenuItemClick = useCallback(
    (event: React.MouseEvent) => {
      const assetSourceName = event.currentTarget.getAttribute(ASSET_SOURCE_DATA_ATTRIBUTE)
      const assetSource = assetSources.find((source) => source.name === assetSourceName)
      if (!assetSource) {
        return
      }
      // For component mode, open the source directly without a file picker
      if (isComponentModeAssetSource(assetSource)) {
        if (onOpenSourceForUpload) {
          onOpenSourceForUpload(assetSource)
        }
        return
      }
      // For picker mode (default), trigger the file input
      const element = document.getElementById(createAssetSourceInputId(assetSource))
      // Test for document.activeElement to avoid clicking the button twice
      if (element && document.activeElement !== element) {
        element.click()
      }
    },
    [assetSources, createAssetSourceInputId, onOpenSourceForUpload],
  )

  const renderMenuItemLabel = useCallback(
    (menuItemContent: React.JSX.Element) => {
      const assetSourceName = menuItemContent.props[ASSET_SOURCE_DATA_ATTRIBUTE]
      const assetSource = assetSources.find((source) => source.name === assetSourceName)
      if (!assetSource) {
        return menuItemContent
      }
      // For component mode, no file input label is needed
      if (isComponentModeAssetSource(assetSource)) {
        return menuItemContent
      }
      return <label htmlFor={createAssetSourceInputId(assetSource)}>{menuItemContent}</label>
    },
    [assetSources, createAssetSourceInputId],
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
          // Only associate with file input for picker mode
          htmlFor={isComponentMode ? undefined : inputId}
          icon={assetSource.icon}
          onClick={handleMenuItemClick}
          renderMenuItem={isComponentMode ? undefined : renderMenuItemLabel}
          text={getAssetSourceDisplayName(assetSource, t, {useStartCaseForName: true})}
        />
      )
    },
    [
      assetSources,
      createAssetSourceInputId,
      handleMenuItemClick,
      renderMenuItemLabel,
      t,
      uploadsDisabled,
    ],
  )

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const assetSourceName = event.target.dataset.assetSourceName
      const assetSource = assetSources.find((source) => source.name === assetSourceName)
      if (!assetSource) {
        return
      }
      if (onSelectFiles && event.target.files) {
        onSelectFiles(assetSource, Array.from(event.target.files))
      }
      event.stopPropagation()
      event.preventDefault()
    },
    [assetSources, onSelectFiles],
  )

  const fileInputs = useMemo(() => {
    // Only render file inputs for picker mode sources (component mode sources handle file selection internally)
    return assetSources
      .filter((assetSource) => !isComponentModeAssetSource(assetSource))
      .map((assetSource) => {
        const _id = createAssetSourceInputId(assetSource)
        return (
          <input
            key={_id}
            accept={accept}
            capture={capture}
            id={_id}
            data-asset-source-name={assetSource.name}
            multiple={multiple}
            onChange={handleFileInputChange}
            type="file"
            value=""
            style={{display: 'none'}}
          />
        )
      })
  }, [accept, assetSources, capture, createAssetSourceInputId, handleFileInputChange, multiple])

  if (assetSources && assetSources.length > 1) {
    const menuItems = assetSources.map((assetSource, index) =>
      renderMenuItemForAssetSource(assetSource, index),
    )
    if (renderAsMenuGroup) {
      return (
        <>
          <MenuGroup
            icon={UploadIcon}
            text={t('input.files.common.upload-placeholder.file-input-button.text')}
            popover={MENU_GROUP_POPOVER}
          >
            {menuItems}
          </MenuGroup>
          {fileInputs}
        </>
      )
    }
    return (
      <>
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
        {fileInputs}
      </>
    )
  }

  return null
}
export const UploadDropDownMenu = memo(forwardRef(UploadDropDownMenuComponent))
