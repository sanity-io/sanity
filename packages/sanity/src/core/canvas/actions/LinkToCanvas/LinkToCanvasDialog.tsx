import {type SanityDocument} from '@sanity/client'
import {ComposeSparklesIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback, useId} from 'react'
import {styled} from 'styled-components'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {canvasLocaleNamespace} from '../../i18n'
import {LinkToCanvasDiff} from './LinkToCanvasDiff'
import {useLinkToCanvas} from './useLinkToCanvas'

const RedirectingBlock = styled(Flex)`
  min-height: 75px; // Keeps it consistent with the loading block, to avoid CLS
`

export const LinkToCanvasDialog = ({
  document,
  onClose,
}: {
  document: SanityDocument | undefined
  onClose: () => void
}) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const id = useId()
  const {status, error, redirectUrl, response} = useLinkToCanvas({document})

  const navigateToCanvas = useCallback(() => {
    // TODO: Use comlink to navigate to canvas
    window.open(redirectUrl, '_blank')
  }, [redirectUrl])

  return (
    <Dialog
      id={`dialog-link-to-canvas-${id}`}
      header={t('dialog.link-to-canvas.title')}
      onClose={onClose}
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
        {status === 'validating' && (
          <Box paddingY={5}>
            <LoadingBlock title={t('dialog.link-to-canvas.validating')} showText />
          </Box>
        )}
        {status === 'redirecting' && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.3}}
          >
            <RedirectingBlock align="center" justify="center" flex={1}>
              <Text size={1} weight="medium">
                {t('dialog.link-to-canvas.redirecting')}
              </Text>
            </RedirectingBlock>
          </motion.div>
        )}
        {(status === 'error' || status === 'missing-document-id') && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.3}}
          >
            <Card border tone="critical" padding={4} radius={3}>
              <Text size={1} weight="medium">
                {error || t('dialog.link-to-canvas.error')}
              </Text>
            </Card>
          </motion.div>
        )}
        {status === 'diff' && response && (
          <LinkToCanvasDiff originalDocument={document} mappedDocument={response.mappedDocument} />
        )}
      </Box>
    </Dialog>
  )
}
