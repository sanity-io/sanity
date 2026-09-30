import {
  type AssetFromSource,
  type AssetSourceComponentProps,
  type ValidationMarker,
} from '@sanity/types'
import {type ReactNode, type Ref, useCallback, useMemo, useState} from 'react'
import {encodeJsonParams} from 'sanity/router'
import {Box, Text} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useColorSchemeValue} from '../../../studio/colorScheme'
import {useWorkspace} from '../../../studio/workspace'
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
      } else {
        setFailed(true)
      }
    },
    [onUnavailable],
  )

  // Headless upload orchestration — the federated equivalent of the hidden
  // iframe `UploadAssetsDialog`, but with no message protocol: the view shares
  // our window, so it drives `uploader` directly and calls `onSelect` itself
  // once its batch is linked (see the ordering note on the view props type).
  if (sourceProps.action === 'upload') {
    if (!sourceProps.uploader) return null
    return (
      <div hidden>
        <FederatedViewMount onUnavailable={handleUnavailable} view={view} viewProps={viewProps} />
      </div>
    )
  }

  return (
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
          <FederatedViewMount onUnavailable={handleUnavailable} view={view} viewProps={viewProps} />
        )}
      </Box>
    </FullSurfaceAppDialog>
  )
}
