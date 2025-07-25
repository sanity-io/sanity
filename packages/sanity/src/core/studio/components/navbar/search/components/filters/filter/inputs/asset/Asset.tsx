import {ChevronDownIcon, ImageIcon, SearchIcon, UndoIcon} from '@sanity/icons'
import {type AssetFromSource, type AssetSource, type ReferenceValue} from '@sanity/types'
import {Box, Flex, Menu, Portal, Stack} from '@sanity/ui'
import {get, startCase} from 'lodash'
import {useCallback, useEffect, useId, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {Button, MenuButton, MenuItem} from '../../../../../../../../../../ui-components'
import {type Source} from '../../../../../../../../../config'
import {sourceName as defaultSourceName} from '../../../../../../../../../form/studio/assetSourceDataset'
import {useClient} from '../../../../../../../../../hooks'
import {useTranslation} from '../../../../../../../../../i18n'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../../../../../studioClient'
import {useSource} from '../../../../../../../../source'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import {type OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {AssetSourceError} from './AssetSourceError'
import {AssetPreview} from './preview/AssetPreview'

type AssetType = keyof Pick<Source['form'], 'file' | 'image'>

const ASSET_TYPE: Record<AssetType, string> = {
  file: 'sanity.fileAsset',
  image: 'sanity.imageAsset',
}

const ContainerBox = styled(Box)`
  width: min(calc(100vw - 40px), 320px);
`

export function SearchFilterAssetInput(type?: AssetType) {
  return function FieldInputAssetWithType({
    onChange,
    value,
  }: OperatorInputComponentProps<ReferenceValue>) {
    const [selectedAssetSource, setSelectedAssetSource] = useState<AssetSource | null>(null)
    const [selectedAssetFromSource, setSelectedAssetFromSource] = useState<AssetFromSource | null>(
      null,
    )

    const {
      state: {fullscreen},
    } = useSearchState()

    const {file, image} = useSource().form
    const {t} = useTranslation()

    // Get available asset sources
    // NOTE: currently only the default studio asset source is supported
    const assetSources = useMemo(() => {
      switch (type) {
        case 'file':
          return file.assetSources.filter((a) => a.name === defaultSourceName)
        case 'image':
          return image.assetSources.filter((a) => a.name === defaultSourceName)
        default:
          throw Error('Unknown asset source found')
      }
    }, [file.assetSources, image.assetSources])

    const menuButtonId = useId()

    const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

    const handleClear = useCallback(() => {
      setSelectedAssetFromSource(null)
      onChange(null)
    }, [onChange])

    const handleCloseAssetSource = useCallback(() => {
      setSelectedAssetSource(null)
    }, [])

    const handleSelectAssetFromSource = useCallback(
      (assetFromSource: AssetFromSource[]) => {
        const firstAsset = assetFromSource[0]
        setSelectedAssetFromSource(firstAsset)
        handleCloseAssetSource()
      },
      [handleCloseAssetSource],
    )

    const handleSelectAssetSource = useCallback(
      (source: AssetSource) => setSelectedAssetSource(source),
      [],
    )

    useEffect(() => {
      // TODO: add custom resolver to handle other source types in future
      if (
        selectedAssetFromSource?.kind === 'assetDocumentId' &&
        typeof selectedAssetFromSource?.value === 'string'
      ) {
        if (type) {
          onChange({
            _ref: selectedAssetFromSource.value,
            _type: ASSET_TYPE[type],
          })
        }
      }
    }, [client, onChange, selectedAssetFromSource])

    const AssetSourceComponent = selectedAssetSource?.component

    const fontSize = fullscreen ? 2 : 1

    const buttonText = t(value ? 'search.filter-asset-change' : 'search.filter-asset-select', {
      context: type,
    })

    const accept = get(type, 'options.accept', type === 'image' ? 'image/*' : '')

    return (
      <ContainerBox>
        <Stack space={3}>
          {/* Asset source component */}
          {selectedAssetSource && AssetSourceComponent && (
            <Portal>
              <AssetSourceComponent
                assetType={type}
                assetSource={selectedAssetSource}
                dialogHeaderTitle={t('search.action.select-asset', {context: type})}
                onClose={handleCloseAssetSource}
                onSelect={handleSelectAssetFromSource}
                selectedAssets={[]}
                selectionType="single"
                accept={accept}
              />
            </Portal>
          )}

          {/* Selected asset preview */}
          {value && <AssetPreview reference={value} />}

          <Flex gap={2}>
            {/* No asset sources found */}
            {assetSources.length === 0 && <AssetSourceError padding={2} />}

            {/* Asset source select */}
            {assetSources.length > 0 && (
              <>
                {assetSources.length > 1 ? (
                  <MenuButton
                    button={
                      <Button
                        icon={value ? UndoIcon : SearchIcon}
                        iconRight={ChevronDownIcon}
                        mode="ghost"
                        width={value ? 'fill' : undefined}
                        text={buttonText}
                      />
                    }
                    id={menuButtonId}
                    menu={
                      <Menu>
                        {assetSources.map((source) => (
                          <MenuItem
                            key={source.name}
                            icon={source.icon || ImageIcon}
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => handleSelectAssetSource(source)}
                            text={
                              (source.i18nKey ? t(source.i18nKey) : source.title) ||
                              startCase(source.name)
                            }
                          />
                        ))}
                      </Menu>
                    }
                    popover={{
                      constrainSize: true,
                      portal: false,
                      radius: 2,
                    }}
                  />
                ) : (
                  <Button
                    icon={value ? UndoIcon : SearchIcon}
                    mode="ghost"
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => handleSelectAssetSource(assetSources[0])}
                    width={value ? 'fill' : undefined}
                    text={buttonText}
                  />
                )}
              </>
            )}

            {/* Clear selected asset */}
            {value && (
              <Button
                mode="ghost"
                onClick={handleClear}
                width="fill"
                text={t('search.filter-asset-clear')}
                tone="critical"
              />
            )}
          </Flex>
        </Stack>
      </ContainerBox>
    )
  }
}
