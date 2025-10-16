import {
  type AssetFromSource,
  type FileSchemaType,
  type ImageSchemaType,
  type SanityDocument,
  type ValidationMarker,
} from '@sanity/types'
import {Box, Card, Flex, useCard, useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../../ui-components'
import {useFormValue} from '../../../../form'
import {useClient} from '../../../../hooks'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n'
import {useWorkspace} from '../../../../studio'
import {validateItem} from '../../../../validation/validateDocument'
import {FormFieldValidationStatus} from '../../../components/formField/FormFieldValidationStatus'
import {useAuthType} from '../hooks/useAuthType'
import {useLinkAssets} from '../hooks/useLinkAssets'
import {useMediaLibraryIds} from '../hooks/useMediaLibraryIds'
import {usePluginFrameUrl} from '../hooks/usePluginFrameUrl'
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
  const card = useCard()
  const {t} = useTranslation()
  const mediaLibraryIds = useMediaLibraryIds()

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
  const [validation, setValidation] = useState([] as ValidationMarker[])

  const client = useClient({apiVersion: mediaLibraryConfig.__internal.apiVersion})
  const workspace = useWorkspace()

  const schema = useSchema()

  const document = useFormValue([])

  const validateSelection = useCallback(
    async (assetSelectionItem: AssetSelectionItem) => {
      const value = {
        _type: 'mainImage',
        media: {
          _ref: `media-library:${mediaLibraryIds?.libraryId}:${assetSelectionItem.asset._id}`,
          _type: 'globalDocumentReference',
          _weak: true,
        },
      }
      const getClient = () => client
      const result = await validateItem({
        value: value,
        getClient,
        path: [],
        schema: schema,
        type: schemaType,
        parent: document,
        i18n: workspace.i18n,
        environment: 'studio',
        document: document as SanityDocument,
        getDocumentExists: async () => {
          return true
        },
      })
      return result
    },
    [client, document, mediaLibraryIds?.libraryId, schema, schemaType, workspace.i18n],
  )

  const pluginFilters = useMemo(() => {
    const filters: any[] = []
    if (schemaType?.options?.mediaLibrary?.filters) {
      filters.push(
        ...schemaType.options.mediaLibrary.filters.map((filter) => ({
          type: 'groq',
          name: filter.name,
          query: filter.query,
          active: true,
        })),
      )
    }
    return filters
  }, [schemaType?.options?.mediaLibrary?.filters])

  const params = useMemo(
    () => ({
      selectionType,
      selectAssetTypes: [selectAssetType === 'sanity.video' ? 'video' : selectAssetType],
      scheme: card.scheme,
      auth: authType,
      pluginFilters,
    }),
    [card.scheme, selectionType, selectAssetType, authType, pluginFilters],
  )
  const iframeUrl = usePluginFrameUrl('/assets', params)

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
        id: 'insert-asset-error',
        title: t('asset-source.dialog.insert-asset-error'),
      })
      console.error(error)
      setDidSelect(false)
    }
  }, [assetSelection, onLinkAssets, onSelect, onClose, toast, t])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleAssetSelection = useCallback(
    async (assetSelectionItems: AssetSelectionItem[]) => {
      if (assetSelectionItems.length === 0) {
        setValidation([])
        return
      }
      const validationResult = await validateSelection(assetSelectionItems[0])
      const hasErrors = validationResult.some((marker) => marker.level === 'error')
      if (hasErrors) {
        setValidation(validationResult)
      }
    },
    [validateSelection],
  )

  const handlePluginMessage = useCallback(
    (message: PluginPostMessage) => {
      if (message.type === 'assetSelection') {
        setAssetSelection(message.selection)
        handleAssetSelection(message.selection)
      }
    },
    [handleAssetSelection],
  )

  const {setIframe} = usePluginPostMessage(appHost, handlePluginMessage)
  if (!open) {
    return null
  }

  return (
    <AppDialog
      header={dialogHeaderTitle}
      id="media-library-plugin-dialog-select-assets"
      onClose={handleClose}
      onClickOutside={handleClose}
      open
      ref={ref}
      data-testid="media-library-plugin-dialog-select-assets"
      width={3}
      footer={
        <Card
          width="fill"
          height="fill"
          padding={3}
          shadow={1}
          style={{
            position: 'relative',
            minHeight: '2dvh',
          }}
        >
          <Flex width="fill" gap={3} justify="flex-end">
            <Flex width="fill" gap={2} justify="flex-end" align="center">
              {validation.length > 0 && (
                <FormFieldValidationStatus fontSize={2} placement="top" validation={validation} />
              )}
              <Button
                mode="bleed"
                onClick={handleClose}
                text={t('asset-source.dialog.button.cancel')}
                size="large"
              />
              <Button
                onClick={handleSelect}
                loading={didSelect}
                disabled={
                  assetSelection.length === 0 ||
                  validation.some((marker) => marker.level === 'error')
                }
                text={t('asset-source.dialog.button.select')}
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
