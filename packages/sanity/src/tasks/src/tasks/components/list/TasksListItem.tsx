/* eslint-disable no-nested-ternary */
import {UserIcon} from '@sanity/icons'
import {Box, Card, type CardProps, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useDateTimeFormat, UserAvatar, useUser} from 'sanity'
import styled from 'styled-components'

import {Tooltip} from '../../../../../ui-components'
import {type TaskDocument} from '../../types'
import {DocumentPreview} from './DocumentPreview'
import {TasksStatus} from './TasksStatus'

interface TasksListItemProps
  extends Pick<TaskDocument, 'title' | 'assignedTo' | 'dueBy' | 'target' | 'status'> {
  documentId: string
  onSelect: () => void
}

export const ThreadCard = styled(Card).attrs<CardProps>(({tone}) => ({
  sizing: 'border',
  borderBottom: true,
  paddingBottom: 3,
}))<CardProps>`
  // ...
`

const Title = styled(Text)`
  &:hover {
    text-decoration: underline;
  }
`

const TaskDetailsRoot = styled(Flex)`
  margin-left: 25px;
`
const UserDisplayRoot = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`

function AssignedUser({userId}: {userId: string}) {
  const [user] = useUser(userId)

  if (!user) {
    return (
      <Text size={1}>
        <UserIcon />
      </Text>
    )
  }
  return (
    <UserAvatar
      user={user}
      size={0}
      // @ts-expect-error `color` is not a valid prop on UserAvatar but it is sent to the `avatar`
      color={user.imageUrl ? null : undefined}
      __unstable_hideInnerStroke
    />
  )
}

const NoAssignedUserRoot = styled.div`
  border-radius: 50%;
  border: 1px dashed var(--card-border-color);
  width: 19px;
  height: 19px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.6;
`
function NoUserAssigned() {
  return (
    <Text size={0} muted>
      <NoAssignedUserRoot>
        <UserIcon />
      </NoAssignedUserRoot>
    </Text>
  )
}
function getTargetDocumentMeta(target?: TaskDocument['target']) {
  if (!target?.document?._ref) {
    return undefined
  }

  return {
    _ref: target?.document._ref,
    _type: target?.documentType,
  }
}

function isThisWeek(date: string) {
  const now = new Date()
  const givenDate = new Date(date)
  const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
  const lastDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6))

  // Reset hours for accurate comparison
  firstDayOfWeek.setHours(0, 0, 0, 0)
  lastDayOfWeek.setHours(23, 59, 59, 999)
  givenDate.setHours(0, 0, 0, 0)

  return givenDate >= firstDayOfWeek && givenDate <= lastDayOfWeek
}

function isToday(date: string) {
  const today = new Date()
  const givenDate = new Date(date)

  return (
    today.getDate() === givenDate.getDate() &&
    today.getMonth() === givenDate.getMonth() &&
    today.getFullYear() === givenDate.getFullYear()
  )
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function TaskDueDate({dueBy}: {dueBy: string}) {
  const dateFormatter = useDateTimeFormat({dateStyle: 'medium'})
  const dueByeDisplayValue = useMemo(() => {
    const dueFormated = dateFormatter.format(new Date(dueBy))
    const [monthAndDay] = dueFormated.split(',')
    return {short: monthAndDay, full: dueFormated}
  }, [dateFormatter, dueBy])

  const isDueByToday = useMemo(() => isToday(dueBy), [dueBy])
  const isDueThisWeek = useMemo(() => isThisWeek(dueBy), [dueBy])

  return (
    <Tooltip content={dueByeDisplayValue.full}>
      <Card tone={isDueByToday ? 'critical' : 'transparent'} padding={1} radius={2}>
        <Flex align="center" gap={2}>
          <Text as="time" size={1} dateTime={dueBy} muted>
            {isDueByToday
              ? 'Today'
              : isDueThisWeek
                ? days[new Date(dueBy).getDay()]
                : dueByeDisplayValue.short}
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
    <ThreadCard>
      <Stack space={2} paddingY={1}>
        <Flex align="center" paddingY={1}>
          <TasksStatus documentId={documentId} status={status} />
          <Title size={1} weight="semibold" onClick={onSelect}>
            {title || 'Untitled'}
          </Title>
          <UserDisplayRoot>
            {assignedTo ? <AssignedUser userId={assignedTo} /> : <NoUserAssigned />}
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
    </ThreadCard>
  )
}
