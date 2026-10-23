import {LaunchIcon} from '@sanity/icons/Launch'
import {Button, Card, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useNumberFormat, useProjectStore, useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import {
  AI_CREDITS_DOCS_URL,
  type AiCredits,
  aiSpendingLimitUrl,
  aiUsageUrl,
} from '../util/aiCredits'

export interface AiCreditsStatusProps {
  /** The credits as last read, or as the response that turned a request down reported them */
  credits: AiCredits | undefined
  /** The project's API host, which says which Sanity website Manage is on */
  apiHost: string | undefined
  /** Text size of the note; the card has its own */
  size?: 0 | 1
}

/** The ID of the organization the project belongs to, for links to its pages in Manage */
function useOrganizationId(): string | null {
  const projectStore = useProjectStore()
  const organizationId$ = useMemo(() => projectStore.getOrganizationId(), [projectStore])
  return useObservable(organizationId$, null)
}

interface AiCreditsNoteProps {
  used: number
  quota: number | undefined
  apiHost: string | undefined
  size: 0 | 1
}

/** How many credits are left this month, with a link to the organization's AI usage in Manage */
function AiCreditsNote({used, quota, apiHost, size}: AiCreditsNoteProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const numberFormat = useNumberFormat()
  const organizationId = useOrganizationId()
  const format = (value: number) => numberFormat.format(value)

  let note: string
  if (quota === undefined) {
    note = t('vision.ai-credits.used', {used: format(used)})
  } else if (used > quota) {
    note = t('vision.ai-credits.deficit', {
      used: format(used),
      deficit: format(used - quota),
      quota: format(quota),
    })
  } else {
    note = t('vision.ai-credits.balance', {balance: format(quota - used), quota: format(quota)})
  }

  return (
    <Text data-testid="vision-ai-credits" muted size={size}>
      {note}{' '}
      <a href={aiUsageUrl(apiHost, organizationId)} rel="noreferrer" target="_blank">
        {t('vision.ai-credits.usage')}
      </a>
    </Text>
  )
}

interface AiCreditsLimitCardProps {
  credits: AiCredits
  apiHost: string | undefined
}

/**
 * The organization is out of AI credits: what that means, and where the limit is raised. Agent
 * Actions turn every request down until then, so this stands where their result would.
 */
function AiCreditsLimitCard({credits, apiHost}: AiCreditsLimitCardProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const numberFormat = useNumberFormat()
  const organizationId = useOrganizationId()
  const {used, quota} = credits

  return (
    <Card border data-testid="vision-ai-credits-limit" padding={3} radius={2}>
      <Stack gap={3}>
        <Text size={1} weight="medium">
          {t('vision.ai-credits.limit.title')}
        </Text>
        <Text muted size={1}>
          {used === undefined || quota === undefined
            ? t('vision.ai-credits.limit.description-unknown')
            : t('vision.ai-credits.limit.description', {
                used: numberFormat.format(used),
                quota: numberFormat.format(quota),
              })}
        </Text>
        <Flex gap={2} justifyContent="flex-end">
          <Button
            as="a"
            fontSize={1}
            href={AI_CREDITS_DOCS_URL}
            iconRight={LaunchIcon}
            mode="bleed"
            padding={2}
            rel="noreferrer"
            target="_blank"
            text={t('vision.ai-credits.limit.learn-more')}
          />
          <Button
            as="a"
            data-testid="vision-ai-credits-manage"
            fontSize={1}
            href={aiSpendingLimitUrl(apiHost, organizationId)}
            padding={2}
            rel="noreferrer"
            target="_blank"
            text={t('vision.ai-credits.limit.manage')}
            tone="primary"
          />
        </Flex>
      </Stack>
    </Card>
  )
}

/**
 * What the organization's AI credits mean for the Agent Actions control this stands under:
 * nothing while they are unknown, how many are left while requests go through, and the way to
 * more of them once the spending limit is reached
 */
export function AiCreditsStatus({credits, apiHost, size = 1}: AiCreditsStatusProps) {
  if (!credits) return null
  if (!credits.granted) return <AiCreditsLimitCard apiHost={apiHost} credits={credits} />
  if (credits.used === undefined) return null
  return <AiCreditsNote apiHost={apiHost} quota={credits.quota} size={size} used={credits.used} />
}
