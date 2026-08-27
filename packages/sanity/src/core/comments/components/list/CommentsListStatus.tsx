import {Stack, Text} from '@sanity/ui'
import {Container,Flex} from 'ui5'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type TFunction} from '../../../i18n/types'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentStatus} from '../../types'

interface EmptyStateMessage {
  title: string
  message: React.ReactNode
}

function getEmptyStateMessages(t: TFunction): Record<CommentStatus, EmptyStateMessage> {
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
      <Flex alignItems="center" justifyContent="center" flexBasis="0%" flexGrow={1} padding={4}>
        <Flex alignItems="center">
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
      <Flex alignItems="center" justifyContent="center" flexBasis="0%" flexGrow={1}>
        <Container size={0} padding={4}>
          <Stack gap={3}>
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
