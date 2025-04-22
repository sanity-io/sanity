import {Box, Flex, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useEffect, useId, useState} from 'react'
import {styled} from 'styled-components'

import {Dialog} from '../../../ui-components'
import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {canvasLocaleNamespace} from '../i18n'

const FadeInBlock = motion.create(Box)
const RedirectingBlock = styled(Flex)`
  min-height: 75px; // Keeps it consistent with the loading block, to avoid CLS
`

export const LinkToCanvasDialog = ({onClose}: {onClose: () => void}) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const id = useId()
  const [status, setStatus] = useState<'validating' | 'redirecting' | 'error'>('validating')

  // TODO: Replace this with the api call
  useEffect(() => {
    setTimeout(() => setStatus('redirecting'), 1000)
  }, [])

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
      </Box>
    </Dialog>
  )
}
