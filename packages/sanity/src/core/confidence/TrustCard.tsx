/* Confidence-surface prototype UI (overhaul branch) — deliberately not
 * localized and not for upstream. See BRIEF-ADDENDUM-confidence-surface. */
/* oxlint-disable @sanity/i18n/no-attribute-string-literals */
import {SparklesIcon} from '@sanity/icons'
import {Badge, Box, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button, Dialog} from '../../ui-components'
import {useDocumentStore} from '../store'
import {applyProposal} from './applyProposal'
import {type AgentProposal, type ConfidenceLevel, type TrustTier} from './mock/types'
import {
  closeProposal,
  getOpenProposal,
  regenerateProposal,
  resolveProposal,
  useConfidenceStoreVersion,
} from './proposalStore'

const CONFIDENCE_TONE: Record<ConfidenceLevel, 'positive' | 'caution' | 'critical'> = {
  high: 'positive',
  medium: 'caution',
  low: 'critical',
}

const TIER_LABEL: Record<TrustTier, string> = {
  T0: 'T0 · propose only',
  T1: 'T1 · propose, fast-track review',
  T2: 'T2 · auto-stage to release',
  T3: 'T3 · auto-commit, spot-checked',
}

const REVERSIBILITY_LABEL: Record<AgentProposal['reversibility'], string> = {
  'draft': 'Draft — fully reversible',
  'staged-release': 'Staged release — reversible until publish',
  'live': 'Live — requires revert to undo',
}

function hatLabel(hat: AgentProposal['hat']): string {
  return hat === 'ops-owner' ? 'Ops owner' : hat.charAt(0).toUpperCase() + hat.slice(1)
}

/**
 * The trust card: the six-field provenance envelope around an agent
 * proposal — hat, diff, intent, evidence, confidence, reversibility — with
 * the accept-gate. Accept executes a REAL document mutation; everything else
 * leaves the document untouched.
 *
 * Mounted once (via `TrustCardHost` in the studio layout); opened by the
 * confidence field action.
 *
 * @internal
 */
export function TrustCardHost() {
  useConfidenceStoreVersion()
  const proposal = getOpenProposal()

  if (!proposal) return null
  return <TrustCardDialog key={proposal.id} proposal={proposal} />
}

function TrustCardDialog(props: {proposal: AgentProposal}) {
  const {proposal} = props
  const documentStore = useDocumentStore()
  const toast = useToast()
  const [applying, setApplying] = useState(false)

  const handleAccept = useCallback(async () => {
    setApplying(true)
    const outcome = await applyProposal(documentStore, proposal)
    setApplying(false)
    if (outcome === 'done') {
      resolveProposal(proposal.id)
      toast.push({
        closable: true,
        status: 'success',
        title: 'Change applied',
        description: `“${proposal.fieldName}” updated on the document.`,
      })
    } else {
      toast.push({closable: true, status: 'error', title: 'Could not apply the change'})
    }
  }, [documentStore, proposal, toast])

  const handleReject = useCallback(() => {
    resolveProposal(proposal.id)
    toast.push({closable: true, status: 'info', title: 'Proposal rejected — document untouched'})
  }, [proposal, toast])

  return (
    <Dialog
      header={
        <Flex align="center" gap={2}>
          <Text size={1}>
            <SparklesIcon />
          </Text>
          <Text size={1} weight="semibold">
            Agent proposal
          </Text>
          {/* 1 · hat: never anonymized to "the system" */}
          <Badge tone="primary">Agent · acting as {hatLabel(proposal.hat)}</Badge>
        </Flex>
      }
      id="trust-card-dialog"
      onClose={closeProposal}
      width={1}
      footer={{
        cancelButton: {onClick: handleReject, text: 'Reject', tone: 'critical'},
        confirmButton: {
          onClick: () => void handleAccept(),
          text: applying ? 'Applying…' : '✓ Accept',
          tone: 'positive',
          disabled: applying,
        },
      }}
    >
      <Stack space={4}>
        <Text muted size={1}>
          {proposal.changeSummary}
        </Text>

        {/* 2 · what changed: field-level before/after */}
        <Stack space={2}>
          <Text muted size={0} weight="medium">
            WHAT CHANGES — “{proposal.fieldName}”
          </Text>
          <Card border padding={3} radius={2} tone="transparent">
            <Text muted size={1} style={{textDecoration: 'line-through'}}>
              {proposal.diff.before}
            </Text>
          </Card>
          <Card border padding={3} radius={2} tone="positive">
            <Text size={1}>{proposal.diff.after}</Text>
          </Card>
        </Stack>

        {/* 3 · why */}
        <Stack space={2}>
          <Text muted size={0} weight="medium">
            WHY
          </Text>
          <Text size={1}>{proposal.intent}</Text>
        </Stack>

        {/* 4 · evidence */}
        <Stack space={2}>
          <Text muted size={0} weight="medium">
            EVIDENCE
          </Text>
          <Flex gap={2} wrap="wrap">
            {proposal.evidence.map((entry) => (
              <Badge key={entry} mode="outline">
                {entry}
              </Badge>
            ))}
          </Flex>
        </Stack>

        <Flex gap={4}>
          {/* 5 · confidence */}
          <Stack flex={1} space={2}>
            <Text muted size={0} weight="medium">
              CONFIDENCE
            </Text>
            <Badge tone={CONFIDENCE_TONE[proposal.confidence]}>{proposal.confidence}</Badge>
          </Stack>

          {/* 6 · reversibility + trust tier */}
          <Stack flex={2} space={2}>
            <Text muted size={0} weight="medium">
              REVERSIBILITY
            </Text>
            <Flex align="center" gap={2} wrap="wrap">
              <Badge>{REVERSIBILITY_LABEL[proposal.reversibility]}</Badge>
              <Badge mode="outline">{TIER_LABEL[proposal.tier]}</Badge>
            </Flex>
          </Stack>
        </Flex>

        <Box>
          <Button
            mode="ghost"
            onClick={() => regenerateProposal(proposal)}
            text="Regenerate proposal"
          />
        </Box>
      </Stack>
    </Dialog>
  )
}
