import {
  type AssetFromSource,
  type AssetSourceComponentProps,
  type ValidationMarker,
} from '@sanity/types'
import {PortalProvider} from '@sanity/ui'
import {type ReactNode, type Ref, useCallback, useMemo, useState} from 'react'
import {encodeJsonParams} from 'sanity/router'
import {Box, Text} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useColorSchemeValue} from '../../../studio/colorScheme'
import {useWorkspace} from '../../../studio/workspace'
import {useRootPortalElement} from '../assetSourceMediaLibrary/shared/MediaLibraryAssetSource'
import {FullSurfaceAppDialog} from './Dialog'
import {FederatedViewMount} from './FederatedViewMount'
import {type FederatedAssetSourceView, type FederatedAssetSourceViewProps} from './types'

/**
 * Hosts a brokered federated `asset_source` view for every asset-source
 * action. The view was already discovered at config time (see
 * `prepareConfig`).
 *
 * - `select` / `openInSource` (and any other visible action): a full-surface
 *   dialog whose body is the mounted view. The view owns its own footer,
 *   selection state and validation display (see
 *   {@link FederatedAssetSourceViewProps}), so the dialog renders no footer.
 * - `upload`: a headless mount — the Studio input owns progress presentation
 *   through the `uploader` prop the view drives directly.
 *
 * Host context (color scheme, workspace project/dataset, the per-workspace
 * persistence key and the optional `validateCandidate` callback) is injected
 * here; source-specific extras arrive through `extraViewProps`.
 *
 * Failure handling: when `onUnavailable` is provided the caller renders its
 * own recovery (the built-in Media Library source falls back to the iframe
 * dialog); otherwise the dialog shows an inline error so a broken remote
 * cannot take the field down.
 *
 * @internal
 */
export function FederatedAssetSourceDialog(props: {
  dialogHeaderTitle?: ReactNode
  /** The view is unavailable (load or mount failed) — recover elsewhere. */
  onUnavailable?: (reason: unknown) => void
  ref?: Ref<HTMLDivElement>
  /** Passed through to the mounted view; the view contract takes the asset-source component props. */
  sourceProps: AssetSourceComponentProps
  view: FederatedAssetSourceView
  /** Host-side validation callback for the view's selection gating. */
  validateCandidate?: (selection: AssetFromSource[]) => Promise<ValidationMarker[]>
  /** Source-specific view props (e.g. the Media Library's libraryId and plugin filters). */
  extraViewProps?: Record<string, unknown>
}): ReactNode {
  const {dialogHeaderTitle, onUnavailable, ref, sourceProps, view, validateCandidate} = props
  const {extraViewProps} = props
  const {t} = useTranslation()
  const scheme = useColorSchemeValue()
  const workspace = useWorkspace()
  // Body-level portal target so the dialog escapes the document pane's own
  // portal (which, with the pane's absolute DialogProvider, would confine
  // this full-surface dialog to the pane) — same treatment as the Media
  // Library and iframe asset sources.
  const portalElement = useRootPortalElement()

  const [failed, setFailed] = useState(false)

  // The same workspace-scoped persistence partition the iframe integration
  // computes, so a picker remembers its location per hosting workspace.
  const pickerPersistenceKey =
    encodeJsonParams({
      projectId: workspace.projectId,
      dataset: workspace.dataset,
      workspaceName: workspace.name,
    }) || undefined

  const viewProps = useMemo<FederatedAssetSourceViewProps>(
    () => ({
      ...sourceProps,
      scheme,
      projectId: workspace.projectId,
      dataset: workspace.dataset,
      pickerPersistenceKey,
      validateCandidate,
      ...extraViewProps,
    }),
    [
      sourceProps,
      scheme,
      workspace.projectId,
      workspace.dataset,
      pickerPersistenceKey,
      validateCandidate,
      extraViewProps,
    ],
  )

  const handleUnavailable = useCallback(
    (reason: unknown) => {
      if (onUnavailable) {
        onUnavailable(reason)
        return
      }
      setFailed(true)
      // In upload mode there is no visible dialog to surface the failure
      // state: fail the queued files so the host's uploader subscription
      // pushes the error toast and `all-complete` releases the field from
      // its upload state instead of leaving it pending forever.
      if (sourceProps.action === 'upload' && sourceProps.uploader) {
        const error = reason instanceof Error ? reason : new Error(String(reason))
        for (const file of sourceProps.uploader.getFiles()) {
          if (file.status === 'pending' || file.status === 'uploading') {
            sourceProps.uploader.updateFile(file.id, {status: 'error', error})
          }
        }
      }
    },
    [onUnavailable, sourceProps.action, sourceProps.uploader],
  )

  // Headless upload orchestration — the federated equivalent of the hidden
  // iframe `UploadAssetsDialog`, but with no message protocol: the view shares
  // our window, so it drives `uploader` directly and calls `onSelect` itself
  // once its batch is linked (see the ordering note on the view props type).
  if (sourceProps.action === 'upload') {
    // On failure the queued files have been failed over to the host (see
    // handleUnavailable); don't keep mounting the broken view.
    if (!sourceProps.uploader || failed) return null
    return (
      <div hidden>
        <FederatedViewMount onUnavailable={handleUnavailable} view={view} viewProps={viewProps} />
      </div>
    )
  }

  return (
    <PortalProvider element={portalElement}>
      <FullSurfaceAppDialog
        header={dialogHeaderTitle ?? view.title}
        id="federated-asset-source-dialog"
        onClose={sourceProps.onClose}
        onClickOutside={sourceProps.onClose}
        open
        ref={ref ?? null}
        data-testid="federated-asset-source-dialog"
        // Fills the studio surface (see FullSurfaceAppDialog); the width prop
        // only serves as a fallback cap should the styled override ever stop
        // matching the Dialog's DOM.
        width={5}
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
          {failed ? (
            <Box padding={4}>
              <Text muted size={1}>
                {t('asset-sources.federated.error.unavailable')}
              </Text>
            </Box>
          ) : (
            <FederatedViewMount
              onUnavailable={handleUnavailable}
              view={view}
              viewProps={viewProps}
            />
          )}
        </Box>
      </FullSurfaceAppDialog>
    </PortalProvider>
  )
}
