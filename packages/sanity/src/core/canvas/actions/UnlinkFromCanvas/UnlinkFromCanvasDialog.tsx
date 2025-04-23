import {type SanityDocument} from '@sanity/client'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {useId} from 'react'

import {Dialog} from '../../../../ui-components'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {unstable_useValuePreview} from '../../../preview/useValuePreview'
import {canvasLocaleNamespace} from '../../i18n'

const useDocumentTitle = ({document}: {document: SanityDocument}) => {
  const schema = useSchema()
  const schemaType = schema.get(document._type)

  const {error, value} = unstable_useValuePreview({
    enabled: Boolean(document),
    schemaType,
    value: document,
  })
  if (!schemaType) return {error: 'Schema type not found'}
  return {error, title: value?.title}
}
export const UnlinkFromCanvasDialog = ({
  document,
  onClose,
  status,
  error,
  handleUnlink,
}: {
  document: SanityDocument
  onClose: () => void
  status: 'loading' | 'error' | 'success' | 'idle'
  error: string | null
  handleUnlink: () => void
}) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const {title} = useDocumentTitle({document})
  const id = useId()

  return (
    <Dialog
      id={`dialog-unlink-from-canvas-${id}`}
      header={t('dialog.unlink-from-canvas.title')}
      onClose={status === 'loading' ? undefined : onClose}
      bodyHeight="stretch"
      footer={{
        cancelButton: {
          text: t('dialog.unlink-from-canvas.cancel'),
          onClick: onClose,
          disabled: status == 'loading',
        },
        confirmButton: {
          text: t('dialog.unlink-from-canvas.unlink-action'),
          onClick: handleUnlink,
          tone: 'default',
          loading: status == 'loading',
          disabled: status == 'loading',
        },
      }}
    >
      <Stack space={3}>
        <Stack space={3}>
          <Box paddingBottom={2}>
            <Text size={1} muted>
              <Translate
                t={t}
                i18nKey="dialog.unlink-from-canvas.unlinking"
                values={{documentTitle: title || 'Untitled'}}
              />
            </Text>
          </Box>
          <Box>
            <Text size={1} muted>
              {t('dialog.unlink-from-canvas.description')}
            </Text>
          </Box>
        </Stack>
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              key={'error'}
              initial={{opacity: 0, scale: 0.9}}
              animate={{opacity: 1, scale: 1}}
            >
              <Card tone="critical" padding={2} radius={3}>
                <Text size={1} weight="medium">
                  {error || t('dialog.unlink-from-canvas.error')}
                </Text>
              </Card>
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div
              key={'success'}
              initial={{opacity: 0, scale: 0.9}}
              animate={{opacity: 1, scale: 1}}
              transition={{duration: 0.2, delay: 0.2}}
            >
              <Card tone="positive" padding={2} radius={3}>
                <Flex padding={2} align={'center'}>
                  <Text size={1} weight="medium">
                    {t('dialog.unlink-from-canvas.success')}
                  </Text>
                </Flex>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Stack>
    </Dialog>
  )
}
