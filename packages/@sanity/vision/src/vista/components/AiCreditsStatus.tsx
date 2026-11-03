import {LaunchIcon} from '@sanity/icons/Launch'
import {Button, Card, Stack, Text} from '@sanity/ui'
import {Suspense, use, useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useNumberFormat, useProjectStore, useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import {
  AI_CREDITS_DOCS_URL,
  type AiCredits,
  aiSpendingLimitUrl,
  aiUsageUrl,
  canUpsellAiCredits,
} from '../util/aiCredits'
import {type AiCreditsUpsellContextValue, useAiCreditsUpsell} from './AiCreditsUpsellContext'

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
    note = t('vista.ai-credits.used', {used: format(used)})
  } else if (used > quota) {
    note = t('vista.ai-credits.deficit', {
      used: format(used),
      deficit: format(used - quota),
      quota: format(quota),
    })
  } else {
    note = t('vista.ai-credits.balance', {balance: format(quota - used), quota: format(quota)})
  }

  return (
    <Text data-testid="vista-ai-credits" muted size={size}>
      {note}{' '}
      <a href={aiUsageUrl(apiHost, organizationId)} rel="noreferrer" target="_blank">
        {t('vista.ai-credits.usage')}
      </a>
    </Text>
  )
}

interface AiCreditsLimitCardProps {
  credits: AiCredits
  apiHost: string | undefined
}

/**
 * The organization is out of AI credits: what that means, and the way to more of them. Agent
 * Actions turn every request down until then, so this stands where their result would. Where a
 * bigger plan comes with more credits and the upsell content has arrived, the way is the upsell
 * dialog; otherwise, and while the content is on its way, it is the spending limit in Manage.
 */
function AiCreditsLimitCard({credits, apiHost}: AiCreditsLimitCardProps) {
  const upsell = useAiCreditsUpsell()
  const manageCard = <AiCreditsLimitCardContent apiHost={apiHost} credits={credits} />
  if (!upsell || !canUpsellAiCredits(credits)) return manageCard
  return (
    <Suspense fallback={manageCard}>
      <UpsellableAiCreditsLimitCard apiHost={apiHost} credits={credits} upsell={upsell} />
    </Suspense>
  )
}

interface UpsellableAiCreditsLimitCardProps extends AiCreditsLimitCardProps {
  upsell: AiCreditsUpsellContextValue
}

/** The card once the upsell content is settled: with the Upgrade button when the content came */
function UpsellableAiCreditsLimitCard({
  credits,
  apiHost,
  upsell,
}: UpsellableAiCreditsLimitCardProps) {
  const {upsellData} = use(upsell.upsellDataPromise)
  const handleUpgrade = useCallback(() => upsell.openDialog('ai_credits_card'), [upsell])
  return (
    <AiCreditsLimitCardContent
      apiHost={apiHost}
      credits={credits}
      onUpgrade={upsellData ? handleUpgrade : undefined}
    />
  )
}

interface AiCreditsLimitCardContentProps extends AiCreditsLimitCardProps {
  /** Opens the upsell dialog; without it, the primary action leads to the spending limit in Manage */
  onUpgrade?: () => void
}

function AiCreditsLimitCardContent({credits, apiHost, onUpgrade}: AiCreditsLimitCardContentProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const numberFormat = useNumberFormat()
  const organizationId = useOrganizationId()
  const {used, quota} = credits

  let description: string
  if (used === undefined || quota === undefined) {
    description = t(
      onUpgrade
        ? 'vista.ai-credits.limit.description-upgrade-unknown'
        : 'vista.ai-credits.limit.description-unknown',
    )
  } else {
    description = t(
      onUpgrade
        ? 'vista.ai-credits.limit.description-upgrade'
        : 'vista.ai-credits.limit.description',
      {used: numberFormat.format(used), quota: numberFormat.format(quota)},
    )
  }

  return (
    <Card border data-testid="vista-ai-credits-limit" padding={3} radius={2}>
      <Stack gap={3}>
        <Text size={1} weight="medium">
          {t('vista.ai-credits.limit.title')}
        </Text>
        <Text muted size={1}>
          {description}
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
            text={t('vista.ai-credits.limit.learn-more')}
          />
          {onUpgrade ? (
            <Button
              data-testid="vista-ai-credits-upgrade"
              fontSize={1}
              onClick={onUpgrade}
              padding={2}
              text={t('vista.ai-credits.limit.upgrade')}
              tone="primary"
            />
          ) : (
            <Button
              as="a"
              data-testid="vista-ai-credits-manage"
              fontSize={1}
              href={aiSpendingLimitUrl(apiHost, organizationId)}
              padding={2}
              rel="noreferrer"
              target="_blank"
              text={t('vista.ai-credits.limit.manage')}
              tone="primary"
            />
          )}
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
