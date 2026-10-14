import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CircleIcon} from '@sanity/icons/Circle'
import {CloseCircleIcon} from '@sanity/icons/CloseCircle'
import {isValidationErrorMarker} from '@sanity/types'
import {Spinner, Text} from '@sanity/ui'
import {useId} from 'react'
import {useTranslation, useValidationStatus} from 'sanity'
import {Box, Flex, VStack} from 'ui5'

import {Dialog} from '../../ui-components/dialog/Dialog'
import {structureLocaleNamespace} from '../i18n'

const IMMEDIATE = {scheduling: 'immediate'} as const

type StepStatus = 'pending' | 'running' | 'done' | 'failed'

function StepIcon({status}: {status: StepStatus}) {
  switch (status) {
    case 'pending':
      return (
        <Text size={1} muted>
          <CircleIcon />
        </Text>
      )
    case 'running':
      return <Spinner muted size={1} />
    case 'done':
      return (
        <Text size={1} muted>
          <CheckmarkCircleIcon />
        </Text>
      )
    case 'failed':
      return (
        <Text size={1} muted>
          <CloseCircleIcon />
        </Text>
      )
    default: {
      const unknownStatus: never = status
      throw new Error(`Unknown step status: ${String(unknownStatus)}`)
    }
  }
}

function Step({
  status,
  label,
  subtext,
  testId,
}: {
  status: StepStatus
  label: string
  subtext?: string
  testId: string
}) {
  return (
    <Flex gap={3} data-testid={testId} data-status={status}>
      <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
        <StepIcon status={status} />
      </Box>
      <VStack gap={2}>
        <Text
          size={1}
          muted={status === 'pending'}
          weight={status === 'running' ? 'medium' : undefined}
        >
          {label}
        </Text>
        {subtext ? (
          <Text size={1} muted>
            {subtext}
          </Text>
        ) : null}
      </VStack>
    </Flex>
  )
}

interface PublishValidationDialogProps {
  documentId: string
  documentType: string
  requirePublishedReferences: boolean
  revision: string | undefined
  publishStatus: 'publishing' | 'published' | undefined
  onClose: () => void
}

/**
 * The steps of a publish that has been waiting on validation for a while: validating the document,
 * now without waiting for idle callbacks, and then publishing it.
 */
export function PublishValidationDialog({
  documentId,
  documentType,
  requirePublishedReferences,
  revision,
  publishStatus,
  onClose,
}: PublishValidationDialogProps) {
  const {t} = useTranslation(structureLocaleNamespace)
  const dialogId = useId()
  // react-rx subscribes after the dialog has committed, so the store only switches to immediate
  // once the dialog is in the DOM; it gets painted at the latest on the run's first yield
  const {
    isValidating,
    validation,
    revision: validatedRevision,
  } = useValidationStatus(documentId, documentType, requirePublishedReferences, IMMEDIATE)
  const validated = !isValidating && validatedRevision === revision
  const errorCount = validated ? validation.filter(isValidationErrorMarker).length : 0

  const validationStatus: StepStatus = validated ? (errorCount > 0 ? 'failed' : 'done') : 'running'
  const validationSubtext = validated
    ? errorCount > 0
      ? t('action.publish.validation-dialog.validation-failed', {count: errorCount})
      : t('action.publish.validation-dialog.validation-completed')
    : undefined
  const publishStepStatus: StepStatus =
    publishStatus === 'publishing' ? 'running' : publishStatus === 'published' ? 'done' : 'pending'

  return (
    <Dialog
      id={dialogId}
      header={t('action.publish.validation-dialog.title')}
      onClose={onClose}
      width={1}
    >
      <VStack gap={4}>
        <Step
          status={validationStatus}
          label={t('action.publish.validation-dialog.validating')}
          subtext={validationSubtext}
          testId="publish-validation-dialog-validation"
        />
        <Step
          status={publishStepStatus}
          label={t('action.publish.validation-dialog.publishing')}
          testId="publish-validation-dialog-publish"
        />
      </VStack>
    </Dialog>
  )
}
