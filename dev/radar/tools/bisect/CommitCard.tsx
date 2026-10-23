import {Card} from '@sanity/ui'
import {type CSSProperties, type ReactNode} from 'react'
import {Text, Flex, VStack, Link} from 'ui5'

import {commitUrl, prUrl} from '../trends/links'
import {AuthorAvatar} from './AuthorAvatar'
import {type BisectCommit} from './bisect'
import {RelativeDate} from './RelativeDate'

/**
 * @sanity/ui v5 removes styling for nested a tags. As a stop gap, apply the
 * current v4 color as an inline style.
 */
const LINK_IN_TEXT: CSSProperties = {color: 'var(--card-link-color)'}

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
      <VStack gap={3}>
        {heading}
        <Text size={2} weight="medium" as="div" trim={true}>
          <Link href={commitUrl(commit.sha)} openInNewTab underlined={false} style={LINK_IN_TEXT}>
            {commit.subject}
          </Link>
        </Text>
        <Flex alignItems="center" gap={3} flexWrap="wrap">
          <Text size={1} as="div" trim={true}>
            <Link href={commitUrl(commit.sha)} openInNewTab underlined={false} style={LINK_IN_TEXT}>
              <code>{commit.sha.slice(0, 10)}</code>
            </Link>
          </Text>
          {typeof commit.prNumber === 'number' && (
            <Text size={1} as="div" trim={true}>
              <Link
                href={prUrl(commit.prNumber)}
                openInNewTab
                underlined={false}
                style={LINK_IN_TEXT}
              >
                #{commit.prNumber}
              </Link>
            </Text>
          )}
          <AuthorAvatar
            name={commit.authorName}
            email={commit.authorEmail}
            login={commit.authorLogin}
            avatarUrl={commit.authorAvatarUrl}
          />
          {commit.authorName && (
            <Text size={1} muted as="div" trim={true} style={{color: 'var(--card-muted-fg-color)'}}>
              {commit.authorName} ·
            </Text>
          )}
          <RelativeDate dateTime={commit.committedAt} muted />
        </Flex>
        {children}
      </VStack>
    </Card>
  )
}
