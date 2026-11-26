import {STUDIO_DSN} from '../../error/sentry/sentryErrorReporter'
import {StudioFeedbackDialog} from '../../feedback/components/StudioFeedbackDialog'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../studio/workspace'

/**
 * The version inventory's feedback dialog. With Content Variants on it asks about versions and
 * variants; without it, about versions only. Feedback is sent with the same source either way.
 *
 * @internal
 */
export function InventoryFeedbackDialog({onClose}: {onClose: () => void}) {
  const {t} = useTranslation()
  const variantsEnabled = useWorkspace().beta?.variants?.enabled === true

  return (
    <StudioFeedbackDialog
      dsn={STUDIO_DSN}
      feedbackVersion="1"
      source="document-group-inventory"
      onClose={onClose}
      sentimentLabel={
        variantsEnabled
          ? t('content-variants.feedback.sentiment-label')
          : t('document-group-inventory.feedback.versions-sentiment-label')
      }
      title={
        variantsEnabled
          ? t('content-variants.feedback.title')
          : t('document-group-inventory.feedback.versions-title')
      }
    />
  )
}
