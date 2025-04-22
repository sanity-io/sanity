import {ChevronDownIcon, ImageIcon, SearchIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {Menu} from '@sanity/ui'
import {startCase} from 'lodash'
import {useCallback} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {type FileAssetProps} from './types'

export function Browser(props: FileAssetProps) {
  const {
    assetSources,
    readOnly,
    id,
    browseButtonElementRef,
    schemaType,
    setIsBrowseMenuOpen,
    setSelectedAssetSource,
  } = props
  const sourcesFromSchema = schemaType.options?.sources
  const {t} = useTranslation()

  const handleSelectAssetFromSource = useCallback(
    (assetSource: AssetSource) => {
      // TODO: is setIsBrowseMenuOpen really necessary?
      setIsBrowseMenuOpen(false)
      setSelectedAssetSource(assetSource)
    },
    [setIsBrowseMenuOpen, setSelectedAssetSource],
  )

  // Legacy support for setting asset sources to an empty array through schema
  // Will still allow for uploading files through the default studio asset source,
  // but not selecting existing assets
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
            text={t('inputs.file.multi-browse-button.text')}
            data-testid="file-input-multi-browse-button"
            icon={SearchIcon}
            iconRight={ChevronDownIcon}
          />
        }
        data-testid="input-select-button"
        menu={
          <Menu>
            {assetSources.map((assetSource) => {
              return (
                <MenuItem
                  key={assetSource.name}
                  text={
                    (assetSource.i18nKey ? t(assetSource.i18nKey) : assetSource.title) ||
                    startCase(assetSource.name)
                  }
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={() => handleSelectAssetFromSource(assetSource)}
                  icon={assetSource.icon || ImageIcon}
                  data-testid={`file-input-browse-button-${assetSource.name}`}
                />
              )
            })}
          </Menu>
        }
      />
    )
  }

  return (
    <Button
      text={t('inputs.file.browse-button.text')}
      icon={SearchIcon}
      mode="bleed"
      // eslint-disable-next-line react/jsx-no-bind
      onClick={() => handleSelectAssetFromSource(assetSources[0])}
      data-testid={`file-input-browse-button-${assetSources[0].name}`}
      disabled={readOnly}
      ref={browseButtonElementRef}
    />
  )
}
