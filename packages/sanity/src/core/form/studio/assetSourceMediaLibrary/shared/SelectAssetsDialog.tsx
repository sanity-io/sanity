import {type AssetFromSource, type FileSchemaType, type ImageSchemaType} from '@sanity/types'
import {Flex, Stack, useTheme, useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'

import {Button} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useAuthType} from '../hooks/useAuthType'
import {useLinkAssets} from '../hooks/useLinkAssets'
import {useMediaLibraryId} from '../hooks/useMediaLibraryId'
import {usePluginPostMessage} from '../hooks/usePluginPostMessage'
import {useSanityMediaLibraryConfig} from '../hooks/useSanityMediaLibraryConfig'
import {type AssetSelectionItem, type AssetType, type PluginPostMessage} from '../types'
import {AppDialog} from './Dialog'
import {Iframe} from './Iframe'

export interface SelectAssetsDialogProps {
  dialogHeaderTitle?: ReactNode
  open: boolean
  onClose: () => void
  onSelect: (assetFromSource: AssetFromSource[]) => void
  ref: React.Ref<HTMLDivElement>
  schemaType?: ImageSchemaType | FileSchemaType
  selectAssetType?: AssetType
  selection: AssetSelectionItem[]
  selectionType?: 'single' | 'multiple'
}

export function SelectAssetsDialog(props: SelectAssetsDialogProps): ReactNode {
  const theme = useTheme()
  const {t} = useTranslation()
  const {dark} = theme.sanity.color
  const libraryId = useMediaLibraryId()

  const mediaLibraryConfig = useSanityMediaLibraryConfig()

  const appHost = mediaLibraryConfig.__internal.hosts.app

  const authType = useAuthType()

  const {
    dialogHeaderTitle,
    onClose,
    open,
    onSelect,
    selectionType = 'single',
    ref,
    selectAssetType,
    schemaType,
  } = props

  const toast = useToast()

  const [assetSelection, setAssetSelection] = useState<AssetSelectionItem[]>(props.selection)
  const [didSelect, setDidSelect] = useState(false)

  const pluginApiVersion = mediaLibraryConfig.__internal.pluginApiVersion
  const appBasePath = mediaLibraryConfig.__internal.appBasePath
  const iframeUrl =
    `${appHost}${appBasePath}/plugin/${pluginApiVersion}/library/${libraryId}/assets?selectionType=${selectionType}` +
    `&selectAssetTypes=${selectAssetType}&scheme=${dark ? 'dark' : 'light'}&auth=${authType}`
  const {onLinkAssets} = useLinkAssets({schemaType})

  const handleSelect = useCallback(async () => {
    try {
      setDidSelect(true)
      // Note: for now we only support selecting a single asset
      const assets = await onLinkAssets([assetSelection[0]])
      onSelect(assets)
      onClose()
    } catch (error) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('asset-source.dialog.insert-asset-error'),
      })
      console.error(error)
      setDidSelect(false)
    }
  }, [assetSelection, onClose, onSelect, onLinkAssets, t, toast])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handlePluginMessage = useCallback((message: PluginPostMessage) => {
    if (message.type === 'assetSelection') {
      setAssetSelection(message.selection)
    }
  }, [])

  const {setIframe} = usePluginPostMessage(appHost, handlePluginMessage)
  if (!open) {
    return null
  }

  return (
    <AppDialog
      animate
      header={dialogHeaderTitle}
      id="media-library-plugin-dialog-select-assets"
      onClose={handleClose}
      open
      ref={ref}
      data-testid="media-library-plugin-dialog-select-assets"
      width={3}
      footer={
        <Flex width="full" gap={3} justify="flex-end" padding={2}>
          <Stack space={3}>
            <Flex width="full" gap={3} justify="flex-end" padding={3}>
              <Button
                mode="ghost"
                onClick={handleClose}
                text={t('asset-source.dialog.button.cancel')}
                size="large"
              />
              <Button
                onClick={handleSelect}
                loading={didSelect}
                disabled={assetSelection.length === 0}
                text={t('asset-source.dialog.button.select')}
                size="large"
              />
            </Flex>
          </Stack>
        </Flex>
      }
    >
      <Iframe ref={setIframe} src={iframeUrl} />
    </AppDialog>
  )
}
