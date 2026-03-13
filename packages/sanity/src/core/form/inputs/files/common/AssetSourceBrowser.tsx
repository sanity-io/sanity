import {ChevronDownIcon, ImageIcon, SearchIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {Menu} from '@sanity/ui'
import {useCallback, useId} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {getAssetSourceDisplayName} from './assetSourceUtils'

/** Derives data-testid prefix from schema type. e.g. file-object-input, image-object-input, video-object-input. */
export function getDataTestIdPrefix(schemaType: {name?: string; jsonType?: string}): string {
  const name = schemaType.name || 'file'
  const jsonType = schemaType.jsonType || 'object'
  const typePart = name === 'sanity.video' ? 'video' : name.replace(/\./g, '-')
  return `${typePart}-${jsonType}-input`
}

export interface AssetSourceBrowserProps {
  assetSources: AssetSource[]
  readOnly?: boolean
  schemaType: {name?: string; jsonType?: string; options?: {sources?: AssetSource[]}}
  onSelectAssetSource: (assetSource: AssetSource) => void
  onCloseMenu?: () => void
}

/**
 * Shared browser component for selecting an asset source to browse from.
 * Used by File and Video inputs.
 *
 * @internal
 */
export function AssetSourceBrowser(props: AssetSourceBrowserProps) {
  const {assetSources, readOnly, schemaType, onSelectAssetSource, onCloseMenu} = props

  const dataTestIdPrefix = getDataTestIdPrefix(schemaType)

  const browseButtonText = 'asset-source.browse-button.text'
  const menuButtonId = useId()

  const {t} = useTranslation()
  const sourcesFromSchema = schemaType.options?.sources

  const handleSelect = useCallback(
    (assetSource: AssetSource) => {
      onCloseMenu?.()
      onSelectAssetSource(assetSource)
    },
    [onCloseMenu, onSelectAssetSource],
  )

  if (sourcesFromSchema?.length === 0) {
    return null
  }

  if (assetSources.length === 0) return null

  if (assetSources.length > 1 && !readOnly) {
    return (
      <MenuButton
        id={menuButtonId}
        button={
          <Button
            mode="bleed"
            text={t(browseButtonText)}
            data-testid={`${dataTestIdPrefix}-multi-browse-button`}
            icon={SearchIcon}
            iconRight={ChevronDownIcon}
          />
        }
        data-testid={`${dataTestIdPrefix}-select-button-${menuButtonId.replace(/:/g, '-')}`}
        menu={
          <Menu>
            {assetSources.map((assetSource) => (
              <MenuItem
                key={assetSource.name}
                text={getAssetSourceDisplayName(assetSource, t, {useStartCaseForName: true})}
                onClick={() => handleSelect(assetSource)}
                icon={assetSource.icon || ImageIcon}
                data-testid={`${dataTestIdPrefix}-browse-button-${assetSource.name}`}
              />
            ))}
          </Menu>
        }
      />
    )
  }

  return (
    <Button
      text={t(browseButtonText)}
      icon={SearchIcon}
      mode="bleed"
      onClick={() => handleSelect(assetSources[0])}
      data-testid={`${dataTestIdPrefix}-browse-button-${assetSources[0].name}`}
      disabled={readOnly}
    />
  )
}
