import {Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'

import {Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'

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
      <Stack space={4}>
        <Text>{t('releases.upsell.misconfiguration.message')}</Text>
      </Stack>
    </Dialog>
  )
}
