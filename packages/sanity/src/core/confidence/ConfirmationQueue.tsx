/* Confidence-surface prototype UI (overhaul branch) — deliberately not
 * localized and not for upstream. See BRIEF-ADDENDUM-confidence-surface. */
/* oxlint-disable @sanity/i18n/no-attribute-string-literals */
import {SparklesIcon} from '@sanity/icons'
import {Badge, Box, Card, Checkbox, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button, Dialog} from '../../ui-components'
import {useDocumentStore} from '../store'
import {applyProposal} from './applyProposal'
import {type AgentProposal, type MockBatch} from './mock/types'
import {
  closeBatch,
  getOpenBatch,
  isProposalResolved,
  resolveProposal,
  useConfidenceStoreVersion,
} from './proposalStore'

function hatLabel(hat: AgentProposal['hat']): string {
  return hat === 'ops-owner' ? 'Ops owner' : hat.charAt(0).toUpperCase() + hat.slice(1)
}

/**
 * The confirmation queue: an autonomous agent batch presented as ONE
 * reviewable unit — the "agent did N things overnight" surface. Each entry
 * carries its provenance; accepting maps to real per-document mutations.
 * Deferred, batched human supervision: background ≠ unsupervised.
 *
 * @internal
 */
export function ConfirmationQueueHost() {
  useConfidenceStoreVersion()
  const batch = getOpenBatch()

  if (!batch) return null
  return <ConfirmationQueueDialog key={batch.id} batch={batch} />
}

function ConfirmationQueueDialog(props: {batch: MockBatch}) {
  const {batch} = props
  const documentStore = useDocumentStore()
  const toast = useToast()
  useConfidenceStoreVersion()

  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)

  const pending = useMemo(
    () => batch.proposals.filter((proposal) => !isProposalResolved(proposal.id)),
    // version-driven re-render keeps this current
    [batch.proposals],
  )

  const toggleChecked = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const acceptProposals = useCallback(
    async (proposals: AgentProposal[]) => {
      setApplying(true)
      let done = 0
      for (const proposal of proposals) {
        const outcome = await applyProposal(documentStore, proposal)
        if (outcome === 'done') {
          resolveProposal(proposal.id)
          done++
        }
      }
      setApplying(false)
      toast.push({
        closable: true,
        status: done > 0 ? 'success' : 'error',
        title: `Applied ${done} of ${proposals.length} changes`,
      })
      if (done === proposals.length && proposals.length === pending.length) closeBatch()
    },
    [documentStore, pending.length, toast],
  )

  const rejectAll = useCallback(() => {
    for (const proposal of pending) resolveProposal(proposal.id)
    toast.push({closable: true, status: 'info', title: 'Batch rejected — documents untouched'})
    closeBatch()
  }, [pending, toast])

  const selected = pending.filter((proposal) => checked.has(proposal.id))
  const acceptTargets = selected.length > 0 ? selected : pending

  return (
    <Dialog
      header={
        <Flex align="center" gap={2}>
          <Text size={1}>
            <SparklesIcon />
          </Text>
          <Text size={1} weight="semibold">
            {batch.title}
          </Text>
          <Badge tone="primary">Agent · acting as {hatLabel(batch.hat)}</Badge>
          <Badge mode="outline">{pending.length} pending</Badge>
        </Flex>
      }
      id="confirmation-queue-dialog"
      onClose={closeBatch}
      width={2}
      footer={{
        cancelButton: {onClick: rejectAll, text: 'Reject batch', tone: 'critical'},
        confirmButton: {
          onClick: () => void acceptProposals(acceptTargets),
          text: applying
            ? 'Applying…'
            : selected.length > 0
              ? `✓ Accept selected (${selected.length})`
              : `✓ Accept all (${pending.length})`,
          tone: 'positive',
          disabled: applying || pending.length === 0,
        },
      }}
    >
      <Stack space={3}>
        <Text muted size={1}>
          One reviewable unit: every change below is accept-gated. Nothing touches a document until
          you accept it.
        </Text>
        {pending.length === 0 && (
          <Card border padding={4} radius={2} tone="transparent">
            <Text align="center" muted size={1}>
              All changes in this batch are resolved.
            </Text>
          </Card>
        )}
        {pending.map((proposal) => (
          <Card key={proposal.id} border padding={3} radius={2}>
            <Flex align="flex-start" gap={3}>
              <Box paddingTop={1}>
                <Checkbox
                  checked={checked.has(proposal.id)}
                  onChange={() => toggleChecked(proposal.id)}
                />
              </Box>
              <Stack flex={1} space={3}>
                <Flex align="center" gap={2} wrap="wrap">
                  <Text size={1} weight="medium">
                    {proposal.documentId} · “{proposal.fieldName}”
                  </Text>
                  <Badge mode="outline">{proposal.tier}</Badge>
                  <Badge>{proposal.confidence}</Badge>
                </Flex>
                <Text muted size={1} style={{textDecoration: 'line-through'}}>
                  {proposal.diff.before}
                </Text>
                <Text size={1}>{proposal.diff.after}</Text>
                <Flex gap={2}>
                  <Button
                    disabled={applying}
                    mode="ghost"
                    onClick={() => void acceptProposals([proposal])}
                    text="Accept"
                    tone="positive"
                  />
                  <Button
                    disabled={applying}
                    mode="bleed"
                    onClick={() => resolveProposal(proposal.id)}
                    text="Reject"
                    tone="critical"
                  />
                </Flex>
              </Stack>
            </Flex>
          </Card>
        ))}
      </Stack>
    </Dialog>
  )
}
