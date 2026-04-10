import {useToast} from '@sanity/ui'
import {useCallback} from 'react'

import {useTranslation} from '../../i18n'
import {feedbackLocaleNamespace} from '../../i18n/localeNamespaces'
import {StudioFeedbackProvider} from '../../studio/feedback/StudioFeedbackProvider'
import {FeedbackDialog, type FeedbackDialogProps} from './FeedbackDialog'

/** @internal */
export type StudioFeedbackDialogProps = Omit<FeedbackDialogProps, 'onSuccess' | 'onError'>

function StudioFeedbackDialogInner(props: StudioFeedbackDialogProps) {
  const toast = useToast()
  const {t} = useTranslation(feedbackLocaleNamespace)

  const handleSuccess = useCallback(() => {
    toast.push({status: 'success', title: t('feedback.success'), closable: true})
  }, [toast, t])

  const handleError = useCallback(
    (err: Error) => {
      toast.push({
        status: 'warning',
        title: t('feedback.error'),
        description: err.message,
        closable: true,
      })
    },
    [toast, t],
  )

  return <FeedbackDialog {...props} onSuccess={handleSuccess} onError={handleError} />
}

/**
 * Studio-aware wrapper around {@link FeedbackDialog}.
 *
 * Wraps the dialog with a {@link StudioFeedbackProvider} so that
 * telemetry consent, user info, and studio tags are supplied
 * automatically from studio context hooks.
 *
 * Shows toast notifications on success/error via the studio's ToastProvider.
 *
 * @internal
 */
export function StudioFeedbackDialog(props: StudioFeedbackDialogProps) {
  return (
    <StudioFeedbackProvider>
      <StudioFeedbackDialogInner {...props} />
    </StudioFeedbackProvider>
  )
}
