import {Flex, Stack, useTheme} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {useTranslation} from 'react-i18next'

import {Button} from '../../../../../ui-components'
import {useAuthType} from '../hooks/useAuthType'
import {usePluginPostMessage} from '../hooks/usePluginPostMessage'
import {useSanityMediaLibraryConfig} from '../hooks/useSanityMediaLibraryConfig'
import {type AssetSelectionItem, type AssetType, type PluginPostMessage} from '../types'
import {AppDialog} from './Dialog'
import {Iframe} from './Iframe'

export interface SelectAssetsDialogProps {
  dialogHeaderTitle?: ReactNode
  libraryId: string
  onClose: () => void
  onSelect: (selection: AssetSelectionItem[]) => Promise<void>
  ref: React.Ref<HTMLDivElement>
  selectAssetType?: AssetType
  selection: AssetSelectionItem[]
  selectionType?: 'single' | 'multiple'
}

export function SelectAssetsDialog(props: SelectAssetsDialogProps): ReactNode {
  const theme = useTheme()
  const {t} = useTranslation()
  const {dark} = theme.sanity.color

  const mediaLibraryConfig = useSanityMediaLibraryConfig()

  const appHost = mediaLibraryConfig.__internal.hosts.app

  const authType = useAuthType()

  const {
    dialogHeaderTitle,
    libraryId,
    onClose,
    onSelect,
    selectionType = 'single',
    ref,
    selectAssetType,
  } = props

  const [assetSelection, setAssetSelection] = useState<AssetSelectionItem[]>(props.selection)
  const [didSelect, setDidSelect] = useState(false)

  const pluginApiVersion = mediaLibraryConfig.__internal.pluginApiVersion
  const appBasePath = mediaLibraryConfig.__internal.appBasePath
  const iframeUrl =
    `${appHost}${appBasePath}/plugin/${pluginApiVersion}/library/${libraryId}/assets?selectionType=${selectionType}` +
    `&selectAssetTypes=${selectAssetType}&scheme=${dark ? 'dark' : 'light'}&auth=${authType}`

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleSelect = useCallback(async () => {
    try {
      setDidSelect(true)
      await onSelect(assetSelection)
    } catch (error) {
      console.error('Error selecting assets:', error)
      setDidSelect(false)
    }
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
      id="sanity-media-library-plugin-dialog-select-assets"
      onClose={handleClose}
      open
      ref={ref}
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
