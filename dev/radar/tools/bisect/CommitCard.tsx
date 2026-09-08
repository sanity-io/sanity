import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {commitUrl, prUrl} from '../trends/links'
import {AuthorAvatar} from './AuthorAvatar'
import {type BisectCommit} from './bisect'
import {RelativeDate} from './RelativeDate'

/** One commit, fully identified: subject, sha, PR, author, age — plus slots. */
export function CommitCard(props: {
  commit: BisectCommit
  tone?: 'critical' | 'primary'
  heading?: ReactNode
  children?: ReactNode
}) {
  const {commit, tone, heading, children} = props
  return (
    <Card padding={4} radius={3} border tone={tone}>
      <Stack gap={3}>
        {heading}
        <Text size={2} weight="medium">
          <a href={commitUrl(commit.sha)} target="_blank" rel="noreferrer">
            {commit.subject}
          </a>
        </Text>
        <Flex align="center" gap={3} wrap="wrap">
          <Text size={1}>
            <a href={commitUrl(commit.sha)} target="_blank" rel="noreferrer">
              <code>{commit.sha.slice(0, 10)}</code>
            </a>
          </Text>
          {typeof commit.prNumber === 'number' && (
            <Text size={1}>
              <a href={prUrl(commit.prNumber)} target="_blank" rel="noreferrer">
                #{commit.prNumber}
              </a>
            </Text>
          )}
          <AuthorAvatar
            name={commit.authorName}
            email={commit.authorEmail}
            login={commit.authorLogin}
            avatarUrl={commit.authorAvatarUrl}
          />
          {commit.authorName && (
            <Text size={1} muted>
              {commit.authorName} ·
            </Text>
          )}
          <RelativeDate dateTime={commit.committedAt} muted />
        </Flex>
        {children}
      </Stack>
    </Card>
  )
}
