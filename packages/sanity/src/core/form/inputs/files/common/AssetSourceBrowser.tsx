import {ChevronDownIcon, ImageIcon, SearchIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {Menu} from '@sanity/ui'
import {useCallback} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {getAssetSourceDisplayName} from './assetSourceUtils'

export interface AssetSourceBrowserProps {
  assetSources: AssetSource[]
  readOnly?: boolean
  id: string
  browseButtonElementRef?: React.RefObject<HTMLButtonElement | null>
  schemaType: {options?: {sources?: AssetSource[]}}
  onSelectAssetSource: (assetSource: AssetSource) => void
  onCloseMenu?: () => void
  /** Prefix for data-testid attributes. e.g. 'file-input' or 'video-input' */
  dataTestIdPrefix?: string
}

/**
 * Shared browser component for selecting an asset source to browse from.
 * Used by File and Video inputs.
 *
 * @internal
 */
export function AssetSourceBrowser(props: AssetSourceBrowserProps) {
  const {
    assetSources,
    readOnly,
    id,
    browseButtonElementRef,
    schemaType,
    onSelectAssetSource,
    onCloseMenu,
    dataTestIdPrefix = 'file-input',
  } = props

  const browseButtonText = 'asset-source.browse-button.text'

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
        id={`${id}_assetFileButton`}
        ref={browseButtonElementRef}
        button={
          <Button
            mode="bleed"
            text={t(browseButtonText)}
            data-testid={`${dataTestIdPrefix}-multi-browse-button`}
            icon={SearchIcon}
            iconRight={ChevronDownIcon}
          />
        }
        data-testid="input-select-button"
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
      ref={browseButtonElementRef}
    />
  )
}
