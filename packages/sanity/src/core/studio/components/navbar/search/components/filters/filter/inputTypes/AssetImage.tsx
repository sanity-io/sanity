import {SanityAsset} from '@sanity/asset-utils'
import {ChevronDownIcon, ImageIcon, SearchIcon} from '@sanity/icons'
import type {AssetFromSource, AssetSource} from '@sanity/types'
import {Box, Button, Menu, MenuButton, MenuItem, Stack} from '@sanity/ui'
import React, {useCallback, useEffect, useId, useState} from 'react'
import {useClient} from '../../../../../../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../../../../studioClient'
import {useSource} from '../../../../../../../source'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'
import {AssetImagePreview} from './imagePreview/AssetImagePreview'

export function FieldInputAssetImage({onChange, value}: OperatorInputComponentProps<SanityAsset>) {
  const [selectedAssetSource, setSelectedAssetSource] = useState<AssetSource | null>(null)
  const [selectedAssetFromSource, setSelectedAssetFromSource] = useState<AssetFromSource | null>(
    null
  )

  const {
    state: {fullscreen},
  } = useSearchState()

  // Get available asset sources
  const {assetSources} = useSource().form.image

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
      const result = (await client.fetch(`
        *[_id == "${assetId}"] {
          _id,
          _type,
          assetId,
          extension,
          originalFilename,
          path,
          url
        }[0]
      `)) as SanityAsset
      if (result) {
        onChange(result)
        // setImageUrl(`${result.url}?h=200&fit=max`)
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

  return (
    <Box style={{width: 'min(calc(100vw - 40px), 320px)'}}>
      <Stack space={3}>
        {selectedAssetSource && AssetSourceComponent && (
          <AssetSourceComponent
            selectedAssets={[]}
            assetType="image"
            onClose={handleCloseAssetSource}
            onSelect={handleSelectAssetFromSource}
            selectionType="single"
          />
        )}

        {/* Image Preview */}
        {value && <AssetImagePreview asset={value} />}

        {/* Asset source select */}
        {assetSources && assetSources.length >= 0 && (
          <>
            {assetSources.length > 1 ? (
              <MenuButton
                button={
                  <Button
                    fontSize={fontSize}
                    icon={SearchIcon}
                    iconRight={ChevronDownIcon}
                    mode="ghost"
                    text={value ? 'Replace' : 'Select'}
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
                icon={SearchIcon}
                mode="ghost"
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => handleSelectAssetSource(assetSources[0])}
                text={value ? 'Replace' : 'Select'}
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
            text="Clear"
            tone="critical"
          />
        )}
      </Stack>
    </Box>
  )
}
