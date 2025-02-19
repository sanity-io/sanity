import {Flex, Stack, useTheme} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {useTranslation} from 'react-i18next'

import {Button} from '../../../../../ui-components'
import {useAuthType} from '../hooks/useAuthType'
import {usePluginPostMessage} from '../hooks/usePluginPostMessage'
import {useSanityAssetLibraryConfig} from '../hooks/useSanityAssetLibraryConfig'
import {type AssetSelectionItem, type AssetType, type PluginPostMessage} from '../types'
import {AppDialog} from './Dialog'
import {Iframe} from './Iframe'

export interface SelectAssetsDialogProps {
  dialogHeaderTitle?: ReactNode
  libraryId: string
  onClose: () => void
  onSelect: (selection: AssetSelectionItem[]) => void
  selection: AssetSelectionItem[]
  selectionType?: 'single' | 'multiple'
  selectAssetType?: AssetType
}

export function SelectAssetsDialog(props: SelectAssetsDialogProps): ReactNode {
  const theme = useTheme()
  const {t} = useTranslation()
  const {dark} = theme.sanity.color

  const assetLibraryConfig = useSanityAssetLibraryConfig()

  const appHost = assetLibraryConfig.__internal.hosts.app

  const authType = useAuthType()

  const {dialogHeaderTitle, libraryId, onClose, onSelect, selectionType = 'single'} = props

  const [assetSelection, setAssetSelection] = useState<AssetSelectionItem[]>(props.selection)

  const pluginApiVersion = assetLibraryConfig.__internal.pluginApiVersion
  const appBasePath = assetLibraryConfig.__internal.appBasePath
  const assetType = props.selectAssetType
  const iframeUrl =
    `${appHost}${appBasePath}/plugin/${pluginApiVersion}/library/${libraryId}/assets?selectionType=${selectionType}` +
    `&selectAssetTypes=${assetType}&scheme=${dark ? 'dark' : 'light'}&auth=${authType}`

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleSelect = useCallback(() => {
    onSelect(assetSelection)
  }, [onSelect, assetSelection])

  const handlePluginMessage = useCallback((message: PluginPostMessage) => {
    if (message.type === 'assetSelection') {
      setAssetSelection(message.selection)
    }
  }, [])

  const {setIframe} = usePluginPostMessage(appHost, handlePluginMessage)

  return (
    <AppDialog
      animate
      header={dialogHeaderTitle}
      id="sanity-asset-library-plugin-dialog-select-assets"
      onClose={handleClose}
      open
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
