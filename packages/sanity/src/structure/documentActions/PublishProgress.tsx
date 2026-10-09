import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CircleIcon} from '@sanity/icons/Circle'
import {CloseCircleIcon} from '@sanity/icons/CloseCircle'
import {Box, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../i18n'

export type PublishProgressValidation =
  | {status: 'running'}
  | {status: 'passed'}
  | {status: 'failed'; errorCount: number}

export type PublishProgressPublish = 'pending' | 'running' | 'succeeded' | 'failed'

export interface PublishProgressProps {
  validation: PublishProgressValidation
  publish: PublishProgressPublish
}

type StepStatus = 'pending' | 'running' | 'succeeded' | 'failed'

function StepIcon({status}: {status: StepStatus}) {
  switch (status) {
    case 'running':
      return <Spinner muted size={1} />
    case 'succeeded':
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
    case 'pending':
      return (
        <Text size={1} muted>
          <CircleIcon />
        </Text>
      )
    default: {
      const unknown: never = status
      throw new Error(`Unknown step status: ${String(unknown)}`)
    }
  }
}

function Step({
  status,
  children,
  testId,
}: {
  status: StepStatus
  children: ReactNode
  testId: string
}) {
  return (
    <Flex align="center" gap={3} data-testid={testId} data-status={status}>
      <Box flex="none" style={{width: 17, height: 17}}>
        <StepIcon status={status} />
      </Box>
      <Text
        size={1}
        muted={status === 'pending'}
        weight={status === 'running' ? 'medium' : undefined}
      >
        {children}
      </Text>
    </Flex>
  )
}

/**
 * The steps of a publish that is taking a while: validation (running, passed, or the number of
 * errors it found) and the publish itself (not started yet, running, done, or failed).
 */
export function PublishProgress({validation, publish}: PublishProgressProps) {
  const {t} = useTranslation(structureLocaleNamespace)

  const validationStatus: StepStatus =
    validation.status === 'running'
      ? 'running'
      : validation.status === 'failed'
        ? 'failed'
        : 'succeeded'

  return (
    <Stack gap={3} data-testid="publish-progress">
      <Step status={validationStatus} testId="publish-progress-validation">
        {validation.status === 'failed'
          ? t('action.publish.progress.validation-errors', {count: validation.errorCount})
          : t('action.publish.progress.validating')}
      </Step>
      <Step status={publish} testId="publish-progress-publish">
        {publish === 'failed'
          ? t('action.publish.progress.publish-failed')
          : t('action.publish.progress.publishing')}
      </Step>
    </Stack>
  )
}
