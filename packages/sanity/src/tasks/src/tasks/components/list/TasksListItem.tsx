import {Flex, Stack, Text, Card, CardProps, TextSkeleton} from '@sanity/ui'
import styled from 'styled-components'
import {forwardRef, useEffect, useMemo, useState} from 'react'
import {SanityDocument} from '@sanity/types'
import {CalendarIcon, DocumentIcon, UserIcon} from '@sanity/icons'
import {TaskDocument} from '../../types'
import {TasksStatus} from './TasksStatus'
import {
  unstable_useValuePreview as useValuePreview,
  useDateTimeFormat,
  useUser,
  useSchema,
  useClient,
} from 'sanity'
import {IntentLink} from 'sanity/router'

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
  :hover {
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
            <Text size={1} muted>
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

function DocumentPreview({documentId, documentType}: {documentId: string; documentType: string}) {
  const [documentValue, setDocumentValue] = useState<SanityDocument | null>(null)
  const client = useClient({
    apiVersion: '2023-01-01',
  }).withConfig({
    perspective: 'previewDrafts',
  })
  const schema = useSchema()
  const documentSchema = schema.get(documentType)
  const {isLoading, value} = useValuePreview({
    enabled: true,
    schemaType: documentSchema,
    value: {
      _id: documentValue?._originalId ?? documentId,
    },
  })

  useEffect(() => {
    if (client) {
      client
        .fetch(`*[_id == $id && _type == $type][0]`, {id: documentId, type: documentType})
        .then((res) => setDocumentValue(res))
    }
  }, [client, documentId, documentType])

  const Link = useMemo(
    () =>
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{id: documentId, type: documentType}}
            ref={ref}
          />
        )
      }),
    [documentId, documentType],
  )

  if (!documentSchema) {
    return null
  }
  return (
    <Flex align="center" gap={1}>
      <DocumentIcon />
      {isLoading ? (
        <TextSkeleton size={1} muted />
      ) : (
        <Text size={1} muted as={Link}>
          {value?.title ?? documentSchema.name}
        </Text>
      )}
    </Flex>
  )
}
