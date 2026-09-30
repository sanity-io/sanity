import {Card} from '@sanity/ui'
import {type ReactNode, type Ref, useMemo} from 'react'
import {Box, Flex} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useColorSchemeValue} from '../../../../studio/colorScheme'
import {FullSurfaceAppDialog} from '../../federatedAssetSource/Dialog'
import {FederatedViewMount} from '../../federatedAssetSource/FederatedViewMount'
import {
  type FederatedAssetSourceView,
  type FederatedAssetSourceViewProps,
} from '../../federatedAssetSource/types'
import {useMediaLibraryIds} from '../hooks/useMediaLibraryIds'

export interface FederatedOpenInSourceDialogProps {
  dialogHeaderTitle: ReactNode
  onClose: () => void
  onSelectNewAsset: () => void
  /** The view failed to load or mount — fall back to the iframe dialog. */
  onUnavailable: (reason: unknown) => void
  ref?: Ref<HTMLDivElement>
  selectNewAssetButtonLabel: string
  sourceProps: FederatedAssetSourceViewProps
  view: FederatedAssetSourceView
}

/**
 * Opens an asset in the Media Library for viewing/editing — the federated
 * equivalent of the iframe `OpenInSourceDialog`. The view mounts the asset
 * detail page (navigation disabled) from `sourceProps.assetToOpen`; the
 * footer (select new asset / cancel / done) stays Studio-owned, matching the
 * iframe dialog.
 *
 * Must render inside `MediaLibraryProvider` (see
 * `FederatedMediaLibraryAssetSource`) for the library id.
 *
 * @internal
 */
export function FederatedOpenInSourceDialog(props: FederatedOpenInSourceDialogProps): ReactNode {
  const {
    dialogHeaderTitle,
    onClose,
    onSelectNewAsset,
    onUnavailable,
    ref,
    selectNewAssetButtonLabel,
    sourceProps,
    view,
  } = props

  const {t} = useTranslation()
  const scheme = useColorSchemeValue()
  const mediaLibraryIds = useMediaLibraryIds()

  const viewProps = useMemo<FederatedAssetSourceViewProps>(
    () => ({
      ...sourceProps,
      libraryId: mediaLibraryIds?.libraryId ?? null,
      scheme,
    }),
    [sourceProps, mediaLibraryIds?.libraryId, scheme],
  )

  // A source asset id is required for the view to open the asset page
  // (same guard as the iframe OpenInSourceDialog).
  if (!sourceProps.assetToOpen?.source?.id) {
    console.warn('Cannot open asset in source: missing asset source id', {
      asset: sourceProps.assetToOpen,
    })
    return null
  }

  return (
    <FullSurfaceAppDialog
      header={dialogHeaderTitle}
      id="media-library-federated-dialog-open-in-source"
      onClose={onClose}
      onClickOutside={onClose}
      open
      ref={ref ?? null}
      data-testid="media-library-federated-dialog-open-in-source"
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
          <Flex gap={3} alignItems="center" justifyContent="space-between">
            <Button
              onClick={onSelectNewAsset}
              text={selectNewAssetButtonLabel}
              size="large"
              tone="neutral"
            />
            <Flex gap={2} alignItems="center">
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
        <FederatedViewMount onUnavailable={onUnavailable} view={view} viewProps={viewProps} />
      </Box>
    </FullSurfaceAppDialog>
  )
}
