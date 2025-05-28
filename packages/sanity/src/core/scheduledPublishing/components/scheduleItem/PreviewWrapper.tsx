import {type SchemaType} from '@sanity/types'
import {Badge, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ElementType, type ReactNode, useState} from 'react'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components/tooltip'
import {DocumentStatus} from '../../../components/documentStatus'
import {DocumentStatusIndicator} from '../../../components/documentStatusIndicator'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {useDocumentVersionInfo} from '../../../releases'
import {
  DOCUMENT_HAS_ERRORS_TEXT,
  DOCUMENT_HAS_WARNINGS_TEXT,
  SCHEDULE_ACTION_DICTIONARY,
} from '../../constants'
import useTimeZone from '../../hooks/useTimeZone'
import {useScheduledPublishingEnabled} from '../../tool/contexts/ScheduledPublishingEnabledProvider'
import {type Schedule} from '../../types'
import {type PaneItemPreviewState} from '../../utils/paneItemHelpers'
import {getLastExecuteDate} from '../../utils/scheduleUtils'
import {EMPTY_VALIDATION_STATUS, useValidationState} from '../../utils/validationUtils'
import {ValidateScheduleDoc} from '../validation/SchedulesValidation'
import {ValidationInfo} from '../validation/ValidationInfo'
import DateWithTooltip from './dateWithTooltip/DateWithTooltip'
import StateReasonFailedInfo from './StateReasonFailedInfo'
import User from './User'

const StatusDotPlaceholder = styled(Box)`
  width: 9px;
`
interface Props {
  children?: ReactNode
  contextMenu?: ReactNode
  // eslint-disable-next-line no-undef
  linkComponent?: ElementType | keyof React.JSX.IntrinsicElements
  onClick?: () => void
  previewState?: PaneItemPreviewState
  publishedDocumentId?: string
  schedule: Schedule
  schemaType?: SchemaType
  useElementQueries?: boolean
}

const PreviewWrapper = (props: Props) => {
  const {
    children,
    contextMenu,
    linkComponent,
    onClick,
    previewState,
    publishedDocumentId,
    schedule,
    schemaType,
    useElementQueries,
  } = props
  const {mode} = useScheduledPublishingEnabled()
  const [validationStatus, setValidationStatus] = useState(EMPTY_VALIDATION_STATUS)
  const {validation} = validationStatus
  const {hasError, validationTone} = useValidationState(validation)
  const {formatDateTz} = useTimeZone()

  const executeDate = getLastExecuteDate(schedule)
  const scheduleDate = executeDate ? new Date(executeDate) : null

  return (
    <Card
      padding={1}
      radius={2}
      shadow={1}
      tone={validationTone}
      style={mode === 'upsell' && schedule.state === 'scheduled' ? {opacity: 0.7} : undefined}
    >
      <Flex align="center" gap={1} justify="space-between">
        <Tooltip
          delay={{open: 400}}
          placement="bottom-end"
          content={
            <DocumentStatus draft={previewState?.draft} published={previewState?.published} />
          }
          disabled={!previewState?.draft && !previewState?.published}
        >
          <Card
            __unstable_focusRing
            as={linkComponent ? linkComponent : undefined}
            data-as={onClick || linkComponent ? 'a' : undefined}
            flex={1}
            onClick={onClick}
            padding={1}
            radius={2}
            tabIndex={0}
            tone={validationTone}
          >
            <Flex align="center" gap={3} justify="flex-start" paddingLeft={children ? 0 : [1, 2]}>
              {children && <Box style={{flexBasis: 'auto', flexGrow: 1}}>{children}</Box>}

              {/* Badge */}
              {schedule.action === 'unpublish' && (
                <Flex style={{flexShrink: 0}}>
                  <Badge
                    fontSize={0}
                    mode="outline"
                    tone={SCHEDULE_ACTION_DICTIONARY[schedule.action].badgeTone}
                  >
                    {schedule.action}
                  </Badge>
                </Flex>
              )}

              {/* Schedule date */}
              <Box display={['block', 'none']} style={{flexShrink: 0, width: '90px'}}>
                <Stack space={2}>
                  {scheduleDate ? (
                    <>
                      <Text size={1}>
                        {formatDateTz({date: scheduleDate, format: 'dd/MM/yyyy'})}
                      </Text>
                      <Text size={1}>{formatDateTz({date: scheduleDate, format: 'p'})}</Text>
                    </>
                  ) : (
                    <Text muted size={1}>
                      <em>No date specified</em>
                    </Text>
                  )}
                </Stack>
              </Box>
              <Box
                display={['none', 'block']}
                style={{flexShrink: 0, maxWidth: '250px', width: children ? '35%' : 'auto'}}
              >
                {scheduleDate ? (
                  <DateWithTooltip date={scheduleDate} useElementQueries={useElementQueries} />
                ) : (
                  <Text muted size={1}>
                    <em>No date specified</em>
                  </Text>
                )}
              </Box>

              {/* HACK: render invisible preview wrapper when no children are provided to ensure consistent height */}
              {!children && (
                <Box style={{visibility: 'hidden'}}>
                  <SanityDefaultPreview isPlaceholder />
                </Box>
              )}

              <Flex align="center" style={{flexShrink: 0, marginLeft: 'auto'}}>
                {/* Avatar */}
                <Box display={['none', 'none', 'block']} marginX={3} style={{flexShrink: 0}}>
                  <User id={schedule?.author} />
                </Box>

                {/* Document status */}
                <Box display={['none', 'block']} marginX={[2, 2, 3]} style={{flexShrink: 0}}>
                  {publishedDocumentId ? (
                    <DocumentVersionsStatus publishedDocumentId={publishedDocumentId} />
                  ) : (
                    <StatusDotPlaceholder />
                  )}
                </Box>
              </Flex>
            </Flex>
          </Card>
        </Tooltip>

        <Flex justify="center" style={{width: '38px'}}>
          {/* Validation status (only displayed on upcoming schedules) */}
          {schedule.state === 'scheduled' && (
            <Box>
              <ValidateScheduleDoc schedule={schedule} updateValidation={setValidationStatus} />
              <ValidationInfo
                markers={validation}
                type={schemaType}
                documentId={publishedDocumentId}
                menuHeader={
                  <Box padding={2}>
                    <Text size={1}>
                      {hasError ? DOCUMENT_HAS_ERRORS_TEXT : DOCUMENT_HAS_WARNINGS_TEXT}
                    </Text>
                  </Box>
                }
              />
            </Box>
          )}

          {/* Failed state reason (only displayed on cancelled schedules) */}
          {schedule.state === 'cancelled' && (
            <StateReasonFailedInfo stateReason={schedule.stateReason} />
          )}
        </Flex>

        {/* Failed state reason (only displayed on cancelled schedules) */}
        {schedule.state === 'cancelled' && (
          <StateReasonFailedInfo stateReason={schedule.stateReason} />
        )}

        {/* Context menu */}
        {contextMenu && (
          <Box style={{flexShrink: 0}} paddingRight={2}>
            {contextMenu}
          </Box>
        )}
      </Flex>
    </Card>
  )
}

export default PreviewWrapper

function DocumentVersionsStatus({publishedDocumentId}: {publishedDocumentId: string}) {
  const versionsInfo = useDocumentVersionInfo(publishedDocumentId)
  return <DocumentStatusIndicator draft={versionsInfo.draft} published={versionsInfo.published} />
}
