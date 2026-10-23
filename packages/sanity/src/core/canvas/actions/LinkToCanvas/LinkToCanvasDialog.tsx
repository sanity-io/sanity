import {type SanityDocument} from '@sanity/client'
import {ComposeSparklesIcon} from '@sanity/icons/ComposeSparkles'
import {Card} from '@sanity/ui'
import {useCallback, useId} from 'react'
import {Text, Box} from 'ui5'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {canvasLocaleNamespace} from '../../i18n'
import {useCanvasTelemetry} from '../../useCanvasTelemetry'
import {errorCard} from './LinkToCanvasDialog.css'
import {LinkToCanvasDiff} from './LinkToCanvasDiff'
import {useLinkToCanvas} from './useLinkToCanvas'

export const LinkToCanvasDialog = ({
  document,
  onClose,
}: {
  document: SanityDocument | undefined
  onClose: () => void
}) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const id = useId()
  const {status, error, navigateToCanvas, response} = useLinkToCanvas({document})
  const {linkDialogRejected} = useCanvasTelemetry()

  const handleClose = useCallback(() => {
    onClose()
    if (status === 'diff') {
      linkDialogRejected(response?.diff || [])
    }
  }, [onClose, linkDialogRejected, status, response?.diff])

  return (
    <Dialog
      id={`dialog-link-to-canvas-${id}`}
      header={t('dialog.link-to-canvas.title')}
      onClose={handleClose}
      width={1}
      bodyHeight="stretch"
      padding={false}
      footer={
        status === 'diff'
          ? {
              description: t('dialog.confirm-document-changes.footer-description'),
              confirmButton: {
                text: t('dialog.confirm-document-changes.confirm'),
                icon: ComposeSparklesIcon,
                tone: 'default',
                onClick: navigateToCanvas,
                space: 2,
              },
              cancelButton: {
                text: t('dialog.confirm-document-changes.cancel'),
                onClick: onClose,
              },
            }
          : undefined
      }
    >
      <Box padding={3}>
        {(status === 'validating' || status === 'redirecting') && (
          <Box paddingY={5}>
            <LoadingBlock
              title={
                status === 'validating'
                  ? t('dialog.link-to-canvas.validating')
                  : t('dialog.link-to-canvas.redirecting')
              }
              showText
            />
          </Box>
        )}
        {(status === 'error' || status === 'missing-document-id') && (
          <div className={errorCard}>
            <Card border tone="critical" padding={4} radius={3}>
              <Text size={1} weight="medium" as="div" trim={true} tone="critical">
                {error || t('dialog.link-to-canvas.error')}
              </Text>
            </Card>
          </div>
        )}
        {status === 'diff' && response && (
          <LinkToCanvasDiff originalDocument={document} mappedDocument={response.mappedDocument} />
        )}
      </Box>
    </Dialog>
  )
}
