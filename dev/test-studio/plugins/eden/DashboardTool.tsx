import {AddIcon} from '@sanity/icons/Add'
import {Card, Heading, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {type CurrentUser, IntentButton, useCurrentUser} from 'sanity'
import {IntentLink} from 'sanity/router'
import {Box, Flex, VStack} from 'ui5'

import {EDEN_STATUSES} from './schema'
import {type EdenDocument, useEdenStories} from './useEdenStories'

const MINUTE_IN_MS = 60_000
const HOUR_IN_MS = 60 * MINUTE_IN_MS
const DAY_IN_MS = 24 * HOUR_IN_MS

function formatElapsed(elapsedMs: number, suffix: string): string {
  if (elapsedMs < HOUR_IN_MS) {
    return `${Math.max(1, Math.round(elapsedMs / MINUTE_IN_MS))}m ${suffix}`
  }

  if (elapsedMs < DAY_IN_MS) {
    return `${Math.round(elapsedMs / HOUR_IN_MS)}h ${suffix}`
  }

  return `${Math.round(elapsedMs / DAY_IN_MS)}d ${suffix}`
}

function formatRelativeTime(isoDate: string): string {
  const elapsedMs = Date.now() - new Date(isoDate).getTime()

  return elapsedMs < 0 ? formatElapsed(-elapsedMs, 'from now') : formatElapsed(elapsedMs, 'ago')
}

function getGreetingPeriod(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getGreeting(currentUser: CurrentUser | null, hour: number): string {
  const period = getGreetingPeriod(hour)
  const firstName = currentUser?.name?.split(/\s+/)[0]
  return firstName ? `${period}, ${firstName}` : period
}

function getCardMetaLine(document: EdenDocument): string {
  const category = document.section ?? document.edition
  const byline = (document.byline ?? []).join(', ')
  return [category, byline].filter(Boolean).join(' · ')
}

function groupDocumentsByStatus(documents: EdenDocument[]): Map<string, EdenDocument[]> {
  const knownStatusValues = new Set<string>(EDEN_STATUSES.map((status) => status.value))
  const fallbackStatusValue = EDEN_STATUSES[0].value

  return documents.reduce<Map<string, EdenDocument[]>>((accumulator, document) => {
    const statusValue =
      document.status && knownStatusValues.has(document.status)
        ? document.status
        : fallbackStatusValue
    const columnDocuments = accumulator.get(statusValue) ?? []
    accumulator.set(statusValue, [...columnDocuments, document])
    return accumulator
  }, new Map())
}

function DashboardCard({document}: {document: EdenDocument}) {
  const metaLine = getCardMetaLine(document)

  return (
    <Card
      as={IntentLink}
      intent="edit"
      params={{id: document._id, type: document._type}}
      data-testid="eden-card"
      padding={3}
      radius={2}
      tone="transparent"
      style={{textDecoration: 'none'}}
    >
      <VStack gap={2}>
        <Text size={1} weight="medium">
          {document.headline ?? 'Untitled'}
        </Text>
        {metaLine && (
          <Text size={1} muted>
            {metaLine}
          </Text>
        )}
        <Text size={0} muted>
          {formatRelativeTime(document.publishAt ?? document._updatedAt)}
        </Text>
      </VStack>
    </Card>
  )
}

function NewDocumentButton({
  documentType,
  label,
  tone,
  mode,
  testId,
}: {
  documentType: string
  label: string
  tone: 'primary' | 'default'
  mode: 'default' | 'ghost'
  testId: string
}) {
  const documentId = useMemo(() => uuid(), [])

  return (
    <IntentButton
      intent="edit"
      params={{id: documentId, type: documentType}}
      icon={AddIcon}
      text={label}
      tone={tone}
      mode={mode}
      data-testid={testId}
    />
  )
}

function BoardColumn({
  status,
  documents,
}: {
  status: (typeof EDEN_STATUSES)[number]
  documents: EdenDocument[]
}) {
  return (
    <Box flexGrow={1} minWidth="220px" maxWidth="320px" data-testid={`eden-column-${status.value}`}>
      <VStack gap={3}>
        <Flex alignItems="baseline" justifyContent="space-between">
          <Text size={1} weight="medium">
            {status.title}
          </Text>
          <Text size={1} muted>
            {documents.length}
          </Text>
        </Flex>

        <Box overflowY="auto" maxHeight="calc(100vh - 260px)">
          <VStack gap={2}>
            {documents.length === 0 ? (
              <Text size={1} muted>
                Nothing here
              </Text>
            ) : (
              documents.map((document) => <DashboardCard key={document._id} document={document} />)
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  )
}

export function DashboardTool() {
  const currentUser = useCurrentUser()
  const {documents, loading} = useEdenStories()

  const greeting = getGreeting(currentUser, new Date().getHours())
  const documentsByStatus = groupDocumentsByStatus(documents)
  const storyCount = documents.length

  return (
    <Box padding={5} data-testid="eden-dashboard">
      <VStack gap={5}>
        <Flex alignItems="flex-start" justifyContent="space-between" gap={4}>
          <VStack gap={2}>
            <Heading size={2}>{greeting}</Heading>
            <Text size={1} muted>
              {storyCount} {storyCount === 1 ? 'story' : 'stories'} in progress
            </Text>
          </VStack>

          <Flex gap={2} flexShrink={0}>
            <NewDocumentButton
              documentType="edenStory"
              label="New story"
              tone="primary"
              mode="default"
              testId="eden-new-story"
            />
            <NewDocumentButton
              documentType="edenNewsletter"
              label="New newsletter"
              tone="default"
              mode="ghost"
              testId="eden-new-newsletter"
            />
          </Flex>
        </Flex>

        {loading && documents.length === 0 ? (
          <Text size={1} muted>
            Loading…
          </Text>
        ) : (
          <Flex gap={4} overflowX="auto" paddingBottom={2}>
            {EDEN_STATUSES.map((status) => (
              <BoardColumn
                key={status.value}
                status={status}
                documents={documentsByStatus.get(status.value) ?? []}
              />
            ))}
          </Flex>
        )}
      </VStack>
    </Box>
  )
}
