import {type PluginFilter} from '@sanity/media-library-types'
import {
  type AssetFromSource,
  type FileSchemaType,
  type ImageSchemaType,
  type SanityDocument,
  type ValidationMarker,
} from '@sanity/types'
import {Card} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {validateItem} from '@sanity/validation/_internal'
import {type ReactNode, type Ref, useCallback, useMemo, useState} from 'react'
import {Box, Flex} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {useClient} from '../../../../hooks/useClient'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useColorSchemeValue} from '../../../../studio/colorScheme'
import {useWorkspace} from '../../../../studio/workspace'
import {FormFieldValidationStatus} from '../../../components/formField/FormFieldValidationStatus'
import {useFormValue} from '../../../contexts/FormValue'
import {FullSurfaceAppDialog} from '../../federatedAssetSource/Dialog'
import {FederatedViewMount} from '../../federatedAssetSource/FederatedViewMount'
import {
  type FederatedAssetSourceView,
  type FederatedAssetSourceViewProps,
} from '../../federatedAssetSource/types'
import {useLinkAssets} from '../hooks/useLinkAssets'
import {useMediaLibraryIds} from '../hooks/useMediaLibraryIds'
import {useSanityMediaLibraryConfig} from '../hooks/useSanityMediaLibraryConfig'
import {filterMediaValidationMarkers} from '../shared/validation'
import {type AssetSelectionItem} from '../types'

/**
 * The Media Library select dialog with the brokered federated view as its
 * body. The division of labor matches the iframe `SelectAssetsDialog`: the
 * view browses assets and streams the current selection up (via the
 * `onSelectionChange` view prop — the federated equivalent of the iframe's
 * `assetSelection` postMessage), while Studio owns the footer: it validates
 * each selection against the field's schema `media` rules, disables the
 * Select button on empty or invalid selections, and on confirm links the
 * asset and calls `onSelect`.
 *
 * Must render inside `MediaLibraryProvider` (see
 * `FederatedMediaLibraryAssetSource`) for the library id and link hooks.
 *
 * @internal
 */
export function FederatedSelectAssetsDialog(props: {
  dialogHeaderTitle?: ReactNode
  onClose: () => void
  onSelect: (assetFromSource: AssetFromSource[]) => void
  /** The view is unavailable (load or mount failed) — fall back to the iframe dialog. */
  onUnavailable: (reason: unknown) => void
  ref?: Ref<HTMLDivElement>
  schemaType?: ImageSchemaType | FileSchemaType
  sourceProps: FederatedAssetSourceViewProps
  view: FederatedAssetSourceView
}): ReactNode {
  const {dialogHeaderTitle, onClose, onSelect, onUnavailable, ref, schemaType, sourceProps, view} =
    props

  const {t} = useTranslation()
  const toast = useToast()
  const mediaLibraryIds = useMediaLibraryIds()
  const mediaLibraryConfig = useSanityMediaLibraryConfig()
  const client = useClient({apiVersion: mediaLibraryConfig.__internal.apiVersion})
  const workspace = useWorkspace()
  const schema = useSchema()
  const document = useFormValue([])
  const scheme = useColorSchemeValue()

  const [assetSelection, setAssetSelection] = useState<AssetSelectionItem[]>([])
  const [didSelect, setDidSelect] = useState(false)
  const [validation, setValidation] = useState([] as ValidationMarker[])

  // Same synthetic-document validation as the iframe SelectAssetsDialog: the
  // selected asset becomes a global document reference on a `media` field and
  // only `media` validation markers gate the selection.
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
      return filterMediaValidationMarkers(result)
    },
    [client, document, mediaLibraryIds?.libraryId, schema, schemaType, workspace.i18n],
  )

  // The federated equivalent of the iframe's `assetSelection` message handler.
  // Unlike the iframe dialog, markers are cleared when a re-selection is
  // valid, so a previous error cannot keep the button disabled — and every
  // selected asset is validated (the picker allows multi-select when the
  // host passes `selectionType: 'multiple'`), not just the first.
  const handleSelectionChange = useCallback(
    (selection: AssetSelectionItem[]) => {
      setAssetSelection(selection)
      if (selection.length === 0) {
        setValidation([])
        return
      }
      Promise.all(selection.map((item) => validateSelection(item)))
        .then((validationResults) => {
          const markers = validationResults.flat()
          const hasErrors = markers.some((marker) => marker.level === 'error')
          setValidation(hasErrors ? markers : [])
        })
        .catch((error: unknown) => {
          // Fail open (selection stays allowed), matching the iframe dialog,
          // but never silently: a failed `media` validator (e.g. the asset
          // fetch threw) would otherwise be indistinguishable from a pass.
          console.error('Media Library selection validation failed', error)
        })
    },
    [validateSelection],
  )

  const {onLinkAssets} = useLinkAssets({schemaType})

  const handleSelect = useCallback(async () => {
    try {
      setDidSelect(true)
      // Links every selected asset — one for `selectionType: 'single'` hosts,
      // the whole selection for `'multiple'` (unlike the iframe dialog, which
      // only ever linked the first).
      const assets = await onLinkAssets(assetSelection)
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

  // Read-only GROQ filters from the schema, same source as the iframe payload.
  const pluginFilters = useMemo<PluginFilter[]>(
    () =>
      (schemaType?.options?.mediaLibrary?.filters || []).map((filter) => ({
        type: 'groq' as const,
        name: filter.name,
        query: filter.query,
      })),
    [schemaType?.options?.mediaLibrary?.filters],
  )

  const viewProps = useMemo<FederatedAssetSourceViewProps>(
    () => ({
      ...sourceProps,
      libraryId: mediaLibraryIds?.libraryId ?? null,
      onSelectionChange: handleSelectionChange,
      pluginFilters,
      scheme,
    }),
    [sourceProps, mediaLibraryIds?.libraryId, handleSelectionChange, pluginFilters, scheme],
  )

  return (
    <FullSurfaceAppDialog
      header={dialogHeaderTitle}
      id="media-library-federated-dialog-select-assets"
      onClose={onClose}
      onClickOutside={onClose}
      open
      ref={ref ?? null}
      data-testid="media-library-federated-dialog-select-assets"
      // Fills the studio surface (see FullSurfaceAppDialog); the width prop
      // only serves as a fallback cap should the styled override ever stop
      // matching the Dialog's DOM.
      width={5}
      footer={
        <Card
          height="fill"
          padding={3}
          shadow={1}
          style={{
            position: 'relative',
            minHeight: '2dvh',
          }}
        >
          <Flex gap={3} justifyContent="flex-end">
            <Flex gap={2} justifyContent="flex-end" alignItems="center">
              {validation.length > 0 && (
                <FormFieldValidationStatus fontSize={2} placement="top" validation={validation} />
              )}
              <Button
                mode="bleed"
                onClick={onClose}
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
        <FederatedViewMount onUnavailable={onUnavailable} view={view} viewProps={viewProps} />
      </Box>
    </FullSurfaceAppDialog>
  )
}
