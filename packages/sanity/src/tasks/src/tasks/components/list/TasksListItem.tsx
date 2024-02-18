import {CalendarIcon, UserIcon} from '@sanity/icons'
import {Card, type CardProps, Flex, Stack, Text, TextSkeleton} from '@sanity/ui'
import {useMemo} from 'react'
import {useDateTimeFormat, useUser} from 'sanity'
import styled from 'styled-components'

import {type TaskDocument} from '../../types'
import {DocumentPreview} from './DocumentPreview'
import {TasksStatus} from './TasksStatus'

interface TasksListItemProps
  extends Pick<TaskDocument, 'title' | 'assignedTo' | 'dueBy' | 'target' | 'status'> {
  documentId: string
  onSelect: () => void
}

export const ThreadCard = styled(Card).attrs<CardProps>(({tone}) => ({
  padding: 3,
  radius: 3,
  sizing: 'border',
  tone: tone || 'transparent',
}))<CardProps>`
  // ...
`

const Title = styled(Text)`
  &:hover {
    text-decoration: underline;
  }
`

const SKELETON_INLINE_STYLE: React.CSSProperties = {width: '50%'}

function AssignedToSection({userId}: {userId: string}) {
  const [user] = useUser(userId)

  const name = user?.displayName ? (
    <Text muted size={1} weight="medium" textOverflow="ellipsis" title={user.displayName}>
      {user.displayName}
    </Text>
  ) : (
    <TextSkeleton size={1} style={SKELETON_INLINE_STYLE} />
  )

  return (
    <Flex align="center" gap={1}>
      <UserIcon />
      {name}
    </Flex>
  )
}

function getTargetDocumentMeta(target?: TaskDocument['target']) {
  if (!target?.document._ref) {
    return undefined
  }

  return {
    _ref: target?.document._ref,
    _type: target?.documentType,
  }
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
  const dateFormatter = useDateTimeFormat({
    dateStyle: 'medium',
  })
  const dueByeDisplayValue = useMemo<string | undefined>(() => {
    return dueBy ? dateFormatter.format(new Date(dueBy)) : undefined
  }, [dateFormatter, dueBy])

  const targetDocument = useMemo(() => getTargetDocumentMeta(target), [target])

  return (
    <ThreadCard tone={undefined}>
      <Stack space={2}>
        <Flex>
          <TasksStatus documentId={documentId} status={status} />
          <Title size={1} weight="semibold" onClick={onSelect}>
            {title || 'Untitled'}
          </Title>
        </Flex>
        {assignedTo && <AssignedToSection userId={assignedTo} />}
        {dueByeDisplayValue && (
          <Flex align="center" gap={1}>
            <CalendarIcon />
            <Text as="time" size={1} dateTime={dueBy} muted>
              {dueByeDisplayValue}
            </Text>
          </Flex>
        )}
        {targetDocument && (
          <DocumentPreview documentId={targetDocument._ref} documentType={targetDocument._type} />
        )}
      </Stack>
    </ThreadCard>
  )
}
