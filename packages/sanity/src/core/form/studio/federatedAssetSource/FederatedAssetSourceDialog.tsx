import {type AssetSourceComponentProps} from '@sanity/types'
import {type ReactNode, type Ref, useCallback, useMemo, useState} from 'react'
import {Box, Text} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useColorSchemeValue} from '../../../studio/colorScheme'
import {AppDialog} from './Dialog'
import {FederatedViewMount} from './FederatedViewMount'
import {type FederatedAssetSourceView, type FederatedAssetSourceViewProps} from './types'

/**
 * Mounts a brokered federated `asset_source` view inside the standard dialog
 * shell. The view was already discovered at config time (see `prepareConfig`).
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
}): ReactNode {
  const {dialogHeaderTitle, onUnavailable, ref, sourceProps, view} = props
  const {t} = useTranslation()
  const scheme = useColorSchemeValue()

  const [failed, setFailed] = useState(false)

  const viewProps = useMemo<FederatedAssetSourceViewProps>(
    () => ({...sourceProps, scheme}),
    [sourceProps, scheme],
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

  return (
    <AppDialog
      header={dialogHeaderTitle ?? view.title}
      id="federated-asset-source-dialog"
      onClose={sourceProps.onClose}
      onClickOutside={sourceProps.onClose}
      open
      ref={ref ?? null}
      data-testid="federated-asset-source-dialog"
      width={3}
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
    </AppDialog>
  )
}
