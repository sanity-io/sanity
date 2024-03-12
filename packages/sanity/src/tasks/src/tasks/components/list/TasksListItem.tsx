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
import {useDateTimeFormat} from 'sanity'
import styled from 'styled-components'

import {Tooltip} from '../../../../../ui-components'
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
  &:hover {
    text-decoration: underline;
    background-color: transparent;
  }
`

const TaskDetailsRoot = styled(Flex)`
  /* Checkbox width is 17px and first row gap is 12px. */
  margin-left: 29px;
`
const UserDisplayRoot = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
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

function TaskDueDate({dueBy}: {dueBy: string}) {
  const fullDateFormatter = useDateTimeFormat({dateStyle: 'medium'})
  const monthAndDayFormatter = useDateTimeFormat({month: 'short', day: 'numeric'})
  const dayFormatter = useDateTimeFormat({weekday: 'long'})

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
      <Card tone={isDueByToday ? 'critical' : 'transparent'} padding={1} radius={2}>
        <Flex align="center" gap={2}>
          <Text as="time" size={1} dateTime={dueBy} muted>
            {
              // eslint-disable-next-line no-nested-ternary
              isDueByToday ? 'Today' : isDueThisWeek ? day : monthAndDay
            }
          </Text>
        </Flex>
      </Card>
    </Tooltip>
  )
}

export function TasksListItem({
  assignedTo,
  title,
  dueBy,
  target,
  onSelect,
  documentId,
  status,
}: TasksListItemProps) {
  const targetDocument = useMemo(() => getTargetDocumentMeta(target), [target])

  return (
    <Card sizing={'border'} paddingBottom={3} borderBottom>
      <Stack space={2} paddingY={1}>
        <Flex align="center" paddingY={1} gap={3}>
          <TasksStatus documentId={documentId} status={status} />
          <TitleButton mode="bleed" padding={0} onClick={onSelect}>
            <Text size={1} weight="semibold">
              {title || 'Untitled'}
            </Text>
          </TitleButton>
          <UserDisplayRoot>
            <TasksUserAvatar user={assignedTo ? {id: assignedTo} : undefined} />
          </UserDisplayRoot>
        </Flex>
        {(dueBy || targetDocument) && (
          <TaskDetailsRoot align="center" gap={2} paddingY={1} paddingX={0}>
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
    </Card>
  )
}
