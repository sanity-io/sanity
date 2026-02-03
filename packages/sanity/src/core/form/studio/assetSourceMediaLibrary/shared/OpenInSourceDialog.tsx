import {type PluginPayload} from '@sanity/media-library-types'
import {type Asset} from '@sanity/types'
import {Box, Card, Flex, useTheme} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo} from 'react'

import {Button} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useAuthType} from '../hooks/useAuthType'
import {usePluginFrameUrl} from '../hooks/usePluginFrameUrl'
import {usePluginPostMessage} from '../hooks/usePluginPostMessage'
import {useSanityMediaLibraryConfig} from '../hooks/useSanityMediaLibraryConfig'
import {type PluginPostMessage} from '../types'
import {AppDialog} from './Dialog'
import {Iframe} from './Iframe'

export interface OpenInSourceDialogProps {
  asset: Asset
  dialogHeaderTitle: ReactNode
  selectNewAssetButtonLabel: string
  onClose: () => void
  onSelectNewAsset: () => void
}

/**
 * Dialog that opens an asset in the Media Library for viewing/editing
 */
export function OpenInSourceDialog(props: OpenInSourceDialogProps): ReactNode {
  const {asset, dialogHeaderTitle, onClose, onSelectNewAsset, selectNewAssetButtonLabel} = props
  const theme = useTheme()
  const {t} = useTranslation()
  const {dark} = theme.sanity.color
  const mediaLibraryConfig = useSanityMediaLibraryConfig()
  const appHost = mediaLibraryConfig.__internal.hosts.app
  const authType = useAuthType()

  // Get the asset ID from the source property
  const sourceAssetId = asset.source?.id

  const params = useMemo<PluginPayload>(
    () => ({
      scheme: dark ? 'dark' : 'light',
      auth: authType,
      disableNavigation: true,
      selectAssetTypes: [],
      selectionType: 'single',
    }),
    [dark, authType],
  )

  const iframeUrl = usePluginFrameUrl(`/assets/${sourceAssetId}`, params)

  const handlePluginMessage = useCallback(
    (message: PluginPostMessage) => {
      // Close the dialog when the user navigates away from the asset page
      if (message.type === 'pageUnloaded') {
        onClose()
      }
    },
    [onClose],
  )

  const {setIframe} = usePluginPostMessage(appHost, handlePluginMessage)

  // sourceAssetId is required to construct a valid iframe URL
  if (!sourceAssetId) {
    console.warn('Cannot open asset in source: missing asset source id', {
      asset,
    })
    return null
  }

  return (
    <AppDialog
      header={dialogHeaderTitle}
      id="media-library-plugin-dialog-open-in-source"
      onClose={onClose}
      onClickOutside={onClose}
      open
      data-testid="media-library-plugin-dialog-open-in-source"
      width={3}
      footer={
        <Card
          width="full"
          height="fill"
          padding={3}
          shadow={1}
          style={{
            position: 'relative',
            minHeight: '2dvh',
          }}
        >
          <Flex width="full" gap={3} align="center" justify="space-between">
            <Button
              onClick={onSelectNewAsset}
              text={selectNewAssetButtonLabel}
              size="large"
              tone="neutral"
            />
            <Flex gap={2} align="center">
              <Button
                mode="bleed"
                onClick={onClose}
                text={t('asset-source.dialog.button.cancel')}
                size="large"
              />
              <Button
                onClick={onClose}
                text={t('asset-sources.media-library.open-in-source-dialog.button.done')}
                size="large"
                tone="primary"
              />
            </Flex>
          </Flex>
        </Card>
      }
    >
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          borderTop: '1px solid',
          borderColor: 'var(--card-border-color)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <Iframe ref={setIframe} src={iframeUrl} />
      </Box>
    </AppDialog>
  )
}
