/* Confidence-surface prototype UI (overhaul branch) — deliberately not
 * localized and not for upstream. See BRIEF-ADDENDUM-confidence-surface. */
/* oxlint-disable @sanity/i18n/no-attribute-string-literals, @sanity/i18n/no-attribute-template-literals */
import {SparklesIcon} from '@sanity/icons'
import {Badge, Box, Flex, Menu, Stack, Text} from '@sanity/ui'
import {useId, useMemo} from 'react'

import {Button, MenuButton, MenuItem} from '../../ui-components'
import {getMockBatch} from './mock'
import {isProposalResolved, openBatch, useConfidenceStoreVersion} from './proposalStore'

/**
 * The seeded documents backing the mock "needs you" inbox. Mock-only: a real
 * inbox is fed by pending Agent Actions batches (addendum §7).
 */
const MOCK_INBOX_DOCS = [
  {documentId: 'ux-test-species-1', documentType: 'species'},
  {documentId: 'ux-test-species-3', documentType: 'species'},
  {documentId: 'ux-test-species-5', documentType: 'species'},
  {documentId: 'ux-test-playlist-2', documentType: 'playlist'},
  {documentId: 'ux-test-playlist-7', documentType: 'playlist'},
]

/**
 * The shell's "what needs me" answer: a navbar indicator showing how many
 * agent changes await the human's confidence, opening the needs-you inbox.
 * Pairs with the breadcrumb's "where am I" (P4).
 *
 * @internal
 */
export function NeedsYouButton() {
  useConfidenceStoreVersion()
  const menuId = useId()

  const batch = useMemo(() => getMockBatch('needs-you', MOCK_INBOX_DOCS), [])
  const pending = batch.proposals.filter((proposal) => !isProposalResolved(proposal.id))

  if (pending.length === 0) return null

  return (
    <MenuButton
      button={
        <Button
          aria-label={`${pending.length} agent changes need your review`}
          icon={SparklesIcon}
          mode="bleed"
          text={String(pending.length)}
          tone="primary"
          tooltipProps={{content: 'Agent changes awaiting your confidence'}}
        />
      }
      id={menuId}
      menu={
        <Menu>
          <Box padding={3} paddingBottom={2}>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Needs you
              </Text>
              <Text muted size={1}>
                {pending.length} agent changes awaiting review
              </Text>
            </Stack>
          </Box>
          {pending.slice(0, 5).map((proposal) => (
            <MenuItem
              key={proposal.id}
              onClick={() => openBatch(batch)}
              renderMenuItem={(content) => content}
              text={`${proposal.documentId} · ${proposal.changeSummary}`}
            />
          ))}
          <Box padding={2}>
            <Flex justify="center">
              <Button
                mode="ghost"
                onClick={() => openBatch(batch)}
                text="Review batch"
                tone="primary"
              />
            </Flex>
          </Box>
          <Box padding={2} paddingTop={0}>
            <Badge mode="outline" tone="caution">
              Mock data — illustrative
            </Badge>
          </Box>
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}
