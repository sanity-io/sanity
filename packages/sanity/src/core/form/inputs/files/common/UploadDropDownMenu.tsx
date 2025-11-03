import {ChevronDownIcon, UploadIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {Menu} from '@sanity/ui'
import {startCase, uniqueId} from 'lodash'
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
      const element = document.getElementById(createAssetSourceInputId(assetSource))
      // Test for document.activeElement to avoid clicking the button twice
      if (element && document.activeElement !== element) {
        element.click()
      }
    },
    [assetSources, createAssetSourceInputId],
  )

  const renderMenuItemLabel = useCallback(
    (menuItemContent: React.JSX.Element) => {
      const assetSourceName = menuItemContent.props[ASSET_SOURCE_DATA_ATTRIBUTE]
      const assetSource = assetSources.find((source) => source.name === assetSourceName)
      if (!assetSource) {
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
          renderMenuItem={renderMenuItemLabel}
          text={
            (assetSource.i18nKey ? t(assetSource.i18nKey) : assetSource.title) ||
            startCase(assetSource.name)
          }
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
    return assetSources.map((assetSource) => {
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
