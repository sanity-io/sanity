import {StudioFeedbackProvider} from '../../studio/feedback/StudioFeedbackProvider'
import {FeedbackDialog, type FeedbackDialogProps} from './FeedbackDialog'

/** @internal */
export type StudioFeedbackDialogProps = FeedbackDialogProps

/**
 * Studio-aware wrapper around {@link FeedbackDialog}.
 *
 * Wraps the dialog with a {@link StudioFeedbackProvider} so that
 * telemetry consent, user info, and studio tags are supplied
 * automatically from studio context hooks.
 *
 * @internal
 */
export function StudioFeedbackDialog(props: StudioFeedbackDialogProps) {
  return (
    <StudioFeedbackProvider>
      <FeedbackDialog {...props} />
    </StudioFeedbackProvider>
  )
}
