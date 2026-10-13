import {type SanityDocument} from '@sanity/types'
import {useEffect, useId} from 'react'
import {
  LegacyLayerProvider,
  useImmediateValidation,
  useTranslation,
  type useValidationStatus,
} from 'sanity'

import {Dialog} from '../../ui-components/dialog/Dialog'
import {structureLocaleNamespace} from '../i18n'
import {PublishProgress, type PublishProgressValidation} from './PublishProgress'

/** Where a publish that is taking a while has got to, as the publish action sees it. */
export type PublishPhase =
  | 'validating'
  | 'validation-failed'
  | 'publishing'
  | 'published'
  | 'publish-failed'

type ValidationStatus = ReturnType<typeof useValidationStatus>

export interface PublishProgressDialogProps {
  phase: PublishPhase
  /** The number of validation errors, for the `validation-failed` phase. */
  errorCount: number
  /** The document the publish action is waiting on validation for. */
  validationTarget: SanityDocument | null | undefined
  requirePublishedReferences: boolean
  /** The status of the dialog's own validation run, `null` while it is not running one. */
  onValidation: (status: ValidationStatus | null) => void
  /** Given when the dialog may be dismissed: once the publish has failed, or has gone nowhere. */
  onClose?: () => void
}

/**
 * The dialog that takes over once a publish has been going for a while: it validates the
 * document right away, without the idle-callback pacing of the store's validation, and reports
 * that run back to the publish action, which publishes on whichever validation completes first
 * (see `useImmediateValidation`), and it shows the two steps of the publish: validating the
 * document, then publishing it. It does not publish itself.
 */
export function PublishProgressDialog(props: PublishProgressDialogProps) {
  const {phase, errorCount, validationTarget, requirePublishedReferences, onValidation, onClose} =
    props
  const {t} = useTranslation(structureLocaleNamespace)
  const dialogId = useId()

  // The dialog's own run goes on while validating and, so that its errors stay on screen, while
  // it is the run that failed; it is reported back as it changes and taken back when the dialog
  // goes away.
  const validation = useImmediateValidation(
    validationTarget,
    requirePublishedReferences,
    phase === 'validating' || phase === 'validation-failed',
  )
  useEffect(() => {
    onValidation(validation)
  }, [onValidation, validation])
  useEffect(() => () => onValidation(null), [onValidation])

  const dismissible = onClose !== undefined
  const validationStep: PublishProgressValidation =
    phase === 'validating'
      ? {status: 'running'}
      : phase === 'validation-failed'
        ? {status: 'failed', errorCount}
        : {status: 'passed'}
  const publishStep =
    phase === 'publishing'
      ? 'running'
      : phase === 'published'
        ? 'succeeded'
        : phase === 'publish-failed'
          ? 'failed'
          : 'pending'

  return (
    <LegacyLayerProvider zOffset="fullscreen">
      <Dialog
        id={dialogId}
        header={t('action.publish.progress.title')}
        width={0}
        // nothing else should be reachable while the publish is in progress
        __unstable_hideCloseButton={!dismissible}
        onClose={onClose}
        onClickOutside={onClose}
        footer={
          dismissible ? {cancelButton: {text: t('action.publish.progress.close')}} : undefined
        }
      >
        <PublishProgress validation={validationStep} publish={publishStep} />
      </Dialog>
    </LegacyLayerProvider>
  )
}
