import {CloseIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {Box, Flex, Text, useGlobalKeyDown} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {isValidElementType} from 'react-is'
import {styled} from 'styled-components'

import {Button} from '../../../../../ui-components/button/Button'
import {Popover} from '../../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

// Prevent button text from interfering with drag events
const TargetButton = styled(Button)`
  * {
    pointer-events: none;
  }
`

interface UploadDestinationPickerProps {
  assetSources: AssetSource[]
  onSelectAssetSource?: (source: AssetSource | null) => void
  onClose?: () => void
  text?: string
  referenceElement?: HTMLElement | null
}

export function UploadDestinationPicker(props: UploadDestinationPickerProps) {
  const {assetSources, onSelectAssetSource, text, onClose} = props
  const {t} = useTranslation()

  const assetSourcesWithUpload = assetSources.filter((s) => Boolean(s.Uploader))
  const [modes, setModes] = useState<Record<string, 'bleed' | 'default'>>(
    assetSourcesWithUpload.reduce(
      (acc, source) => {
        acc[source.name] = 'bleed'
        return acc
      },
      {} as Record<string, 'bleed' | 'default'>,
    ),
  )

  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      const target = event.target as HTMLElement
      const sourceName = target.getAttribute('data-asset-source-name') as string
      setModes((prev) => ({...prev, [sourceName]: 'default'}))
      const assetSource = assetSources.find((source) => source.name === sourceName)
      if (assetSource && onSelectAssetSource) {
        onSelectAssetSource(assetSource)
      }
    },
    [assetSources, onSelectAssetSource],
  )

  const handleDragLeave = useCallback(
    (event: React.DragEvent) => {
      const target = event.target as HTMLElement
      const sourceName = target.getAttribute('data-asset-source-name') as string
      setModes((prev) => ({...prev, [sourceName]: 'bleed'}))
      if (onSelectAssetSource) {
        onSelectAssetSource(null)
      }
    },
    [onSelectAssetSource],
  )

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.currentTarget as HTMLElement
      const sourceName = target.getAttribute('data-asset-source-name') as string
      const assetSource = assetSources.find((source) => source.name === sourceName)
      if (assetSource && onSelectAssetSource) {
        onSelectAssetSource(assetSource)
      }
    },
    [assetSources, onSelectAssetSource],
  )

  useGlobalKeyDown((event) => {
    if (event.key === 'Escape') {
      if (onClose) {
        onClose()
      }
    }
  })

  if (assetSourcesWithUpload.length === 0) {
    return null
  }

  return (
    <Popover
      open
      style={{top: '-0.5rem'}}
      referenceElement={props.referenceElement}
      content={
        <Box padding={2}>
          <Box padding={2} paddingLeft={4}>
            <Flex align="center" gap={2}>
              <Box flex={1}>
                <Text size={1} textOverflow="ellipsis" weight="medium">
                  {text}
                </Text>
              </Box>
              <Button
                icon={CloseIcon}
                mode="bleed"
                onClick={onClose}
                tooltipProps={{content: 'Close'}}
              />
            </Flex>
          </Box>

          <Flex>
            {assetSourcesWithUpload.map((assetSource) => {
              const Icon = assetSource.icon
              return (
                <TargetButton
                  key={assetSource.name}
                  data-asset-source-name={assetSource.name}
                  mode={modes[assetSource.name]}
                  onClick={handleClick}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  size="large"
                  style={{
                    padding: '2rem',
                    margin: '0.5rem',
                  }}
                  tone="default"
                  tooltipProps={null}
                >
                  <Flex align="center">
                    {isValidElementType(Icon) && <Icon style={{fontSize: '2rem'}} />}
                    <Box>{assetSource.i18nKey ? t(assetSource.i18nKey) : assetSource.title}</Box>
                  </Flex>
                </TargetButton>
              )
            })}
          </Flex>
        </Box>
      }
    />
  )
}
