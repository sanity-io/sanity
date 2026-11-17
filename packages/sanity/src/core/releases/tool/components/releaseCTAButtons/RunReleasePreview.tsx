import {type ReleaseDocument} from '@sanity/client'
import {Card} from '@sanity/ui'
import {type ReactNode, useId, useMemo, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {Flex, Text, VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../../i18n'
import {
  getReleaseMemberTarget,
  groupReleaseImpactByEffect,
  type ReleaseMemberImpact,
} from '../../../model/releaseImpact'
import {getReleaseDocumentIntent} from '../getReleaseDocumentIntent'
import {ReleaseDocumentPreviewContent} from '../ReleaseDocumentPreview'

/** Groups longer than this show their first items and a "Show all" button. */
export const RUN_PREVIEW_COLLAPSED_LIMIT = 5

const LIST_STYLE = {listStyle: 'none', margin: 0, padding: 0} as const

interface CollapsibleListProps<T> {
  'items': ReadonlyArray<T>
  'getKey': (item: T) => string
  'renderItem': (item: T) => ReactNode
  'aria-labelledby'?: string
  'data-testid'?: string
}

/**
 * A plain list that shows the first {@link RUN_PREVIEW_COLLAPSED_LIMIT} items, and a button to
 * show the rest, so a release with many documents does not stretch the dialog.
 */
export function CollapsibleList<T>({
  items,
  getKey,
  renderItem,
  'aria-labelledby': ariaLabelledBy,
  'data-testid': testId,
}: CollapsibleListProps<T>) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const [expanded, setExpanded] = useState(false)
  const listId = useId()
  const isLong = items.length > RUN_PREVIEW_COLLAPSED_LIMIT
  const visibleItems = isLong && !expanded ? items.slice(0, RUN_PREVIEW_COLLAPSED_LIMIT) : items

  return (
    <VStack gap={1}>
      <VStack
        gap={1}
        as="ul"
        id={listId}
        aria-labelledby={ariaLabelledBy}
        data-testid={testId}
        style={LIST_STYLE}
      >
        {visibleItems.map((item) => (
          <li key={getKey(item)}>{renderItem(item)}</li>
        ))}
      </VStack>
      {isLong && (
        <Flex>
          <Button
            mode="bleed"
            text={
              expanded
                ? t('publish-dialog.run-preview.show-fewer')
                : t('publish-dialog.run-preview.show-all', {count: items.length})
            }
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((current) => !current)}
            data-testid="run-preview-toggle"
          />
        </Flex>
      )}
    </VStack>
  )
}

/**
 * One member, linked to the document in the release's perspective. Opens in a new tab so the
 * dialog stays open.
 */
function RunPreviewMemberLink({
  impact,
  release,
}: {
  impact: ReleaseMemberImpact
  release: ReleaseDocument
}) {
  const {documentId, variantId} = getReleaseMemberTarget(impact)
  const {params, searchParams} = useMemo(
    () =>
      getReleaseDocumentIntent({
        documentId,
        documentTypeName: impact.documentType,
        releaseId: release._id,
        releaseState: release.state,
        variantId,
      }),
    [documentId, impact.documentType, release._id, release.state, variantId],
  )

  return (
    <Card
      as={IntentLink}
      data-as="a"
      intent="edit"
      params={params}
      searchParams={searchParams}
      target="_blank"
      rel="noreferrer"
      radius={2}
      tone="inherit"
    >
      <ReleaseDocumentPreviewContent
        documentId={documentId}
        documentTypeName={impact.documentType}
        releaseId={release._id}
        releaseState={release.state}
        isGoingToUnpublish={impact.effect === 'unpublish'}
        variantId={variantId}
        layout="compact"
      />
    </Card>
  )
}

const getMemberKey = (impact: ReleaseMemberImpact) => {
  const {documentId, variantId} = getReleaseMemberTarget(impact)
  return variantId ? `${documentId}:${variantId}` : documentId
}

function RunPreviewGroup({
  effect,
  members,
  release,
}: {
  effect: ReleaseMemberImpact['effect']
  members: ReleaseMemberImpact[]
  release: ReleaseDocument
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const headingId = useId()

  return (
    <VStack gap={2} data-testid={`run-preview-group-${effect}`}>
      <Flex gap={2} alignItems="center" flexWrap="wrap">
        <Text size={1} weight="semibold" as="h3" id={headingId}>
          {effect === 'add' && t('publish-dialog.run-preview.group.add', {count: members.length})}
          {effect === 'update' &&
            t('publish-dialog.run-preview.group.update', {count: members.length})}
          {effect === 'unpublish' &&
            t('publish-dialog.run-preview.group.unpublish', {count: members.length})}
        </Text>
        <Text size={1} muted as="span">
          {effect === 'add' && t('publish-dialog.run-preview.hint.add')}
          {effect === 'update' && t('publish-dialog.run-preview.hint.update')}
          {effect === 'unpublish' && t('publish-dialog.run-preview.hint.unpublish')}
        </Text>
      </Flex>
      <CollapsibleList
        items={members}
        getKey={getMemberKey}
        aria-labelledby={headingId}
        renderItem={(impact) => <RunPreviewMemberLink impact={impact} release={release} />}
      />
    </VStack>
  )
}

/**
 * What running the release does, member by member, grouped by effect: new, updated, unpublished.
 * Reads membership and effects from the model-neutral release impact only.
 *
 * @internal
 */
export function RunReleasePreview({
  release,
  impacts,
}: {
  release: ReleaseDocument
  impacts: ReadonlyArray<ReleaseMemberImpact>
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const groups = useMemo(() => groupReleaseImpactByEffect(impacts), [impacts])

  if (groups.length === 0) return null

  return (
    <VStack gap={4} data-testid="run-release-preview">
      {groups.map((group) => (
        <RunPreviewGroup
          key={group.effect}
          effect={group.effect}
          members={group.members}
          release={release}
        />
      ))}
      <Text size={1} muted as="p">
        {t('publish-dialog.run-preview.links-open-in-new-tab')}
      </Text>
    </VStack>
  )
}
