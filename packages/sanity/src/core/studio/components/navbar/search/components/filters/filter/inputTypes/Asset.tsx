import {ChevronDownIcon, ImageIcon, SearchIcon, UndoIcon} from '@sanity/icons'
import type {Asset, AssetFromSource, AssetSource} from '@sanity/types'
import {Box, Button, Flex, Menu, MenuButton, MenuItem, Portal, Stack} from '@sanity/ui'
import React, {useCallback, useEffect, useId, useMemo, useState} from 'react'
import {Source} from '../../../../../../../../config'
import {useClient} from '../../../../../../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../../../../studioClient'
import {useSource} from '../../../../../../../source'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'
import {AssetPreview} from './imagePreview/AssetPreview'

type AssetType = keyof Pick<Source['form'], 'file' | 'image'>

export function FieldInputAsset(type?: AssetType) {
  return function FieldInputAssetWithType({onChange, value}: OperatorInputComponentProps<Asset>) {
    const [selectedAssetSource, setSelectedAssetSource] = useState<AssetSource | null>(null)
    const [selectedAssetFromSource, setSelectedAssetFromSource] = useState<AssetFromSource | null>(
      null
    )

    const {
      state: {fullscreen},
    } = useSearchState()

    const {file, image} = useSource().form

    const assetSources = useMemo(() => {
      // Get available asset sources
      switch (type) {
        case 'file':
          return file.assetSources
        case 'image':
          return image.assetSources
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
      [handleCloseAssetSource]
    )

    const handleSelectAssetSource = useCallback(
      (source: AssetSource) => setSelectedAssetSource(source),
      []
    )

    useEffect(() => {
      async function fetchAsset(assetId: string) {
        const result = (await client.fetch(buildAssetQuery(assetId))) as Asset
        if (result) {
          onChange(result)
        }
      }
      // TODO: add custom resolver to handle other source types
      if (
        selectedAssetFromSource?.kind === 'assetDocumentId' &&
        typeof selectedAssetFromSource?.value === 'string'
      ) {
        fetchAsset(selectedAssetFromSource.value)
      }
    }, [client, onChange, selectedAssetFromSource])

    const AssetSourceComponent = selectedAssetSource?.component

    const fontSize = fullscreen ? 2 : 1

    const buttonText = value ? `Replace ${type}` : `Select ${type}`

    return (
      <Box style={{width: 'min(calc(100vw - 40px), 320px)'}}>
        <Stack space={3}>
          {selectedAssetSource && AssetSourceComponent && (
            <Portal>
              <AssetSourceComponent
                assetType={type}
                dialogHeaderTitle={`Select ${type}`}
                onClose={handleCloseAssetSource}
                onSelect={handleSelectAssetFromSource}
                selectedAssets={[]}
                selectionType="single"
              />
            </Portal>
          )}

          {/* Preview */}
          {value && <AssetPreview asset={value} />}

          <Flex gap={2}>
            {/* Asset source select */}
            {assetSources && assetSources.length >= 0 && (
              <>
                {assetSources.length > 1 ? (
                  <MenuButton
                    button={
                      <Button
                        fontSize={fontSize}
                        icon={value ? UndoIcon : SearchIcon}
                        iconRight={ChevronDownIcon}
                        mode="ghost"
                        style={{flex: value ? 1 : 0}}
                        text={buttonText}
                      />
                    }
                    id={menuButtonId}
                    menu={
                      <Menu>
                        {assetSources.map((source) => (
                          <MenuItem
                            fontSize={fontSize}
                            icon={source.icon || ImageIcon}
                            key={source.name}
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => handleSelectAssetSource(source)}
                            text={source.title}
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
                    fontSize={fontSize}
                    icon={value ? UndoIcon : SearchIcon}
                    mode="ghost"
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => handleSelectAssetSource(assetSources[0])}
                    style={{flex: value ? 1 : 0}}
                    text={buttonText}
                  />
                )}
              </>
            )}

            {/* Clear selected asset */}
            {value && (
              <Button
                fontSize={fullscreen ? 2 : 1}
                mode="ghost"
                onClick={handleClear}
                style={{flex: 1}}
                text="Clear"
                tone="critical"
              />
            )}
          </Flex>
        </Stack>
      </Box>
    )
  }
}

function buildAssetQuery(assetId: string): string {
  return `*[_id == "${assetId}"] {
    _id,
    _type,
    assetId,
    extension,
    originalFilename,
    path,
    size,
    url
  }[0]`
}
