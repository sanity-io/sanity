import {type SanityDocument} from '@sanity/client'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useEffect, useId} from 'react'
import {styled} from 'styled-components'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {canvasLocaleNamespace} from '../../i18n'
import {useLinkToCanvas} from './useLinkToCanvas'

const FadeInBlock = motion.create(Box)
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
  const {status, error, redirectUrl} = useLinkToCanvas({document})
  useEffect(() => {
    if (redirectUrl) {
      // TODO: Use comlink to navigate to canvas
      window.open(redirectUrl, '_blank')
    }
  }, [redirectUrl])
  return (
    <Dialog
      id={`dialog-link-to-canvas-${id}`}
      header={t('dialog.link-to-canvas.title')}
      onClose={onClose}
      width={1}
      bodyHeight="stretch"
    >
      <Box paddingY={5}>
        {status === 'validating' && (
          <LoadingBlock title={t('dialog.link-to-canvas.validating')} showText />
        )}
        {status === 'redirecting' && (
          <FadeInBlock
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
          </FadeInBlock>
        )}
        {(status === 'error' || status === 'missing-document-id') && (
          <FadeInBlock
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
          </FadeInBlock>
        )}
      </Box>
    </Dialog>
  )
}
