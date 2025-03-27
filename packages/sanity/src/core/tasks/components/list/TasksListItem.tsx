import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Card,
  Flex,
  Stack,
  Text,
} from '@sanity/ui'
import {isThisISOWeek, isToday} from 'date-fns'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components'
import {useDateTimeFormat, type UseDateTimeFormatOptions} from '../../../hooks'
import {type TaskDocument} from '../../types'
import {TasksUserAvatar} from '../TasksUserAvatar'
import {DocumentPreview} from './DocumentPreview'
import {TasksStatus} from './TasksStatus'

interface TasksListItemProps
  extends Pick<TaskDocument, 'title' | 'assignedTo' | 'dueBy' | 'target' | 'status'> {
  documentId: string
  onSelect: () => void
}

const TitleButton = styled(UIButton)`
  width: 100%;
  max-width: 100%;
`

const TaskDetailsRoot = styled(Flex)`
  /* Checkbox width is 17px and first row gap is 12px. */
  margin-left: 29px;
`

function getTargetDocumentMeta(target?: TaskDocument['target']) {
  if (!target?.document?._ref) {
    return undefined
  }

  return {
    _ref: target?.document._ref,
    _type: target?.documentType,
  }
}
const FULL_DATE_FORMAT_OPTIONS: UseDateTimeFormatOptions = {
  dateStyle: 'medium',
  timeZone: 'UTC',
}
const MONTH_AND_DAY_FORMAT_OPTIONS: UseDateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
}
const DAY_FORMAT_OPTIONS: UseDateTimeFormatOptions = {
  weekday: 'long',
  timeZone: 'UTC',
}
function TaskDueDate({dueBy}: {dueBy: string}) {
  const fullDateFormatter = useDateTimeFormat(FULL_DATE_FORMAT_OPTIONS)
  const monthAndDayFormatter = useDateTimeFormat(MONTH_AND_DAY_FORMAT_OPTIONS)
  const dayFormatter = useDateTimeFormat(DAY_FORMAT_OPTIONS)

  const dateOptions = useMemo(() => {
    const date = new Date(dueBy)
    return {
      fullDate: fullDateFormatter.format(date),
      monthAndDay: monthAndDayFormatter.format(date),
      day: dayFormatter.format(date),
      isDueByToday: isToday(date),
      isDueThisWeek: isThisISOWeek(date),
    }
  }, [dayFormatter, dueBy, fullDateFormatter, monthAndDayFormatter])
  const {fullDate, monthAndDay, day, isDueByToday, isDueThisWeek} = dateOptions

  return (
    <Tooltip content={fullDate}>
      <Card tone={isDueByToday ? 'critical' : 'neutral'} padding={1} radius={2}>
        <Flex align="center" gap={2}>
          <Text as="time" size={1} dateTime={dueBy} muted>
            {isDueByToday ? 'Today' : isDueThisWeek ? day : monthAndDay}
          </Text>
        </Flex>
      </Card>
    </Tooltip>
  )
}

export function TasksListItem(props: TasksListItemProps) {
  const {assignedTo, title, dueBy, target, onSelect, documentId, status} = props
  const targetDocument = useMemo(() => getTargetDocumentMeta(target), [target])

  return (
    <Stack gap={3}>
      <Flex align="center" gap={1}>
        <Box>
          <TasksStatus documentId={documentId} status={status} />
        </Box>

        <Flex flex={1}>
          <TitleButton onClick={onSelect} mode="bleed" padding={2}>
            <Text size={1} textOverflow="ellipsis" weight="semibold">
              {title || 'Untitled'}
            </Text>
          </TitleButton>
        </Flex>

        <TasksUserAvatar user={assignedTo ? {id: assignedTo} : undefined} withTooltip />
      </Flex>

      {(dueBy || targetDocument) && (
        <TaskDetailsRoot align="center" gap={2} paddingX={0}>
          {dueBy && <TaskDueDate dueBy={dueBy} />}

          {targetDocument && (
            <Box marginLeft={1}>
              <DocumentPreview
                documentId={targetDocument._ref}
                documentType={targetDocument._type}
              />
            </Box>
          )}
        </TaskDetailsRoot>
      )}
    </Stack>
  )
}
