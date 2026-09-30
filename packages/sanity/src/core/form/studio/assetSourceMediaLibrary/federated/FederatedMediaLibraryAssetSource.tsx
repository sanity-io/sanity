import {type PluginFilter} from '@sanity/media-library-types'
import {type AssetSourceComponentProps} from '@sanity/types'
import {PortalProvider} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type ReactNode, type RefAttributes, useEffect, useMemo, useState} from 'react'

import {useClient} from '../../../../hooks/useClient'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {FederatedAssetSourceDialog} from '../../federatedAssetSource/FederatedAssetSourceDialog'
import {
  type FederatedAssetSourceView,
  type FederatedAssetSourceViewProps,
} from '../../federatedAssetSource/types'
import {DEFAULT_API_VERSION} from '../constants'
import {useMediaLibraryIds} from '../hooks/useMediaLibraryIds'
import {useValidateAssetCandidate} from '../hooks/useValidateAssetCandidate'
import {MediaLibraryAssetSource, useRootPortalElement} from '../shared/MediaLibraryAssetSource'
import {MediaLibraryProvider} from '../shared/MediaLibraryProvider'

/**
 * The Media Library extension of the federated view contract: the extra host
 * context the Media Library view needs beyond the source-agnostic base props.
 * Passed through the generic dialog's `extraViewProps`.
 *
 * @internal
 */
export interface MediaLibraryFederatedViewProps extends FederatedAssetSourceViewProps {
  /** The Media Library the picker should browse. */
  libraryId?: string | null
  /** Read-only GROQ filters from the schema (`options.mediaLibrary.filters`). */
  pluginFilters?: PluginFilter[]
}

/**
 * The built-in Media Library asset source, fully federated: every action —
 * select, upload, open-in-source — mounts the Media Library's brokered
 * `asset_source` view through the generic `FederatedAssetSourceDialog`. The
 * view owns the dialog body, footer, selection validation display and the
 * asset linking; Studio contributes the ML-specific host context (library id,
 * plugin filters, the `validateCandidate` implementation) and the dialog
 * titles. When loading or mounting the view fails, the source falls back to
 * the iframe `MediaLibraryAssetSource` for all actions — never a dead field.
 *
 * @internal
 */
export function FederatedMediaLibraryAssetSource(
  props: AssetSourceComponentProps & {
    libraryId: string | null
    view: FederatedAssetSourceView
  } & RefAttributes<HTMLDivElement>,
): ReactNode {
  const {libraryId, view, ...sourceProps} = props
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const projectId = client.config().projectId
  const [unavailable, setUnavailable] = useState(false)
  // Body-level portal target so the dialog escapes the document pane's portal
  // and fills the whole studio surface, exactly like the iframe asset source.
  const portalElement = useRootPortalElement()

  // The React Compiler memoizes this; identity is stable across renders.
  const handleUnavailable = () => setUnavailable(true)

  if (unavailable) {
    return <MediaLibraryAssetSource {...sourceProps} libraryId={libraryId} />
  }

  if (!projectId) {
    throw new Error('No projectId found')
  }

  return (
    <MediaLibraryProvider projectId={projectId} libraryId={libraryId}>
      <PortalProvider element={portalElement}>
        <FederatedMediaLibraryDialog
          onUnavailable={handleUnavailable}
          sourceProps={sourceProps}
          view={view}
        />
      </PortalProvider>
    </MediaLibraryProvider>
  )
}

/**
 * Inner half of the federated Media Library source, rendered inside
 * `MediaLibraryProvider` so the ML hooks (library ids, candidate validation)
 * have their context. Computes the ML view extras and the per-action dialog
 * title, and keeps the already-exists upload warning toasts that the iframe
 * integration shows.
 */
function FederatedMediaLibraryDialog(props: {
  onUnavailable: (reason: unknown) => void
  sourceProps: AssetSourceComponentProps & RefAttributes<HTMLDivElement>
  view: FederatedAssetSourceView
}): ReactNode {
  const {onUnavailable, sourceProps, view} = props
  const {t} = useTranslation()
  const toast = useToast()
  const mediaLibraryIds = useMediaLibraryIds()

  const {
    action = 'select',
    assetToOpen,
    assetType = 'image',
    dialogHeaderTitle,
    ref,
    schemaType,
    uploader,
  } = sourceProps

  const validateCandidate = useValidateAssetCandidate({schemaType})

  // The already-exists warning toasts: the view links duplicates like any
  // other upload and reports them with the `alreadyExists` terminal status,
  // which surfaces on the `all-complete` event.
  useEffect(() => {
    if (action !== 'upload' || !uploader) return undefined
    return uploader.subscribe((event) => {
      if (event.type === 'all-complete') {
        const existingFiles = event.files.filter((file) => file.status === 'alreadyExists')
        existingFiles.forEach((file) => {
          toast.push({
            status: 'warning',
            title: t('asset-sources.media-library.warning.file-already-exist.title', {
              filename: file.file.name,
            }),
            description: t('asset-sources.media-library.warning.file-already-exist.description'),
            closable: true,
            duration: 10000,
          })
        })
      }
    })
  }, [action, t, toast, uploader])

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

  const extraViewProps = useMemo<Record<string, unknown>>(
    () =>
      ({
        libraryId: mediaLibraryIds?.libraryId ?? null,
        pluginFilters,
      }) satisfies Partial<MediaLibraryFederatedViewProps>,
    [mediaLibraryIds?.libraryId, pluginFilters],
  )

  // A source asset id is required for the view to open the asset page
  // (same guard as the iframe OpenInSourceDialog).
  if (action === 'openInSource' && !assetToOpen?.source?.id) {
    console.warn('Cannot open asset in source: missing asset source id', {asset: assetToOpen})
    return null
  }

  // Mirrors the header and asset-type mapping of the iframe dialogs.
  const selectAssetType = assetType === 'sanity.video' ? 'video' : assetType
  const title =
    action === 'openInSource'
      ? t('asset-sources.media-library.open-in-source-dialog.title')
      : dialogHeaderTitle ||
        t('asset-sources.media-library.select-dialog.title', {
          context: selectAssetType,
          targetTitle: schemaType?.title,
        })

  return (
    <FederatedAssetSourceDialog
      dialogHeaderTitle={title}
      extraViewProps={extraViewProps}
      onUnavailable={onUnavailable}
      ref={ref}
      sourceProps={sourceProps}
      validateCandidate={validateCandidate}
      view={view}
    />
  )
}
