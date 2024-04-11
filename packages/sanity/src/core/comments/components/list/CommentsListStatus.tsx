import {Container, Flex, Stack, Text} from '@sanity/ui'

import {LoadingBlock} from '../../../components'
import {type TFunction, useTranslation} from '../../../i18n'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentStatus} from '../../types'

interface EmptyStateMessage {
  title: string
  message: React.ReactNode
}

export function getEmptyStateMessages(t: TFunction): Record<CommentStatus, EmptyStateMessage> {
  return {
    open: {
      title: t('list-status.empty-state-open-title'),
      message: t('list-status.empty-state-open-text'),
    },
    resolved: {
      title: t('list-status.empty-state-resolved-title'),
      message: t('list-status.empty-state-resolved-text'),
    },
  }
}

interface CommentsListStatusProps {
  error: Error | null
  hasNoComments: boolean
  loading: boolean
  status: CommentStatus
}

export function CommentsListStatus(props: CommentsListStatusProps) {
  const {status, error, loading, hasNoComments} = props
  const {t} = useTranslation(commentsLocaleNamespace)
  const emptyStateMessages = getEmptyStateMessages(t)

  if (error) {
    return (
      <Flex align="center" justify="center" flex={1} padding={4}>
        <Flex align="center">
          <Text size={1} muted>
            {t('list-status.error')}
          </Text>
        </Flex>
      </Flex>
    )
  }

  if (loading) {
    return <LoadingBlock showText title={t('list-status.loading')} />
  }

  if (hasNoComments) {
    return (
      <Flex align="center" justify="center" flex={1} sizing="border">
        <Container width={0} padding={4}>
          <Stack space={3}>
            <Text align="center" size={1} muted weight="medium">
              {emptyStateMessages[status].title}
            </Text>

            <Text align="center" size={1} muted>
              {emptyStateMessages[status].message}
            </Text>
          </Stack>
        </Container>
      </Flex>
    )
  }

  return null
}
