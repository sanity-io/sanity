import {useCallback} from 'react'
import {Text, VStack} from 'ui5'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n/hooks/useTranslation'

interface ReleaseLimitsMisconfigurationDialogProps {
  onClose: () => void
}

export function ReleaseLimitsMisconfigurationDialog(
  props: ReleaseLimitsMisconfigurationDialogProps,
) {
  const {onClose} = props
  const {t} = useTranslation()

  const handleContactSupport = useCallback(() => {
    window.open('https://www.sanity.io/contact/support', '_blank', 'noopener,noreferrer')
    onClose()
  }, [onClose])

  return (
    <Dialog
      id="releases-misconfiguration-dialog"
      header={t('releases.upsell.misconfiguration.header')}
      width={1}
      onClose={onClose}
      footer={{
        confirmButton: {
          text: t('releases.upsell.misconfiguration.contact-support'),
          onClick: handleContactSupport,
          tone: 'primary',
        },
      }}
    >
      <VStack gap={4}>
        <Text as="div" trim={true}>
          {t('releases.upsell.misconfiguration.message')}
        </Text>
      </VStack>
    </Dialog>
  )
}
