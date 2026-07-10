/* Confidence-surface prototype (overhaul branch) — not for upstream. */
import {SparklesIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {defineDocumentFieldAction} from '../config/document/fieldActions/define'
import {getPendingProposal, openProposal, useConfidenceStoreVersion} from './proposalStore'

/**
 * The field-level entry point to the trust card: an always-relevant field
 * action that surfaces when the (mock) agent has a pending proposal for the
 * field. Renders as a button (rank: primary in the action doctrine) with a
 * sparkle — the ambient "an agent has something for you here" marker.
 *
 * @internal
 */
export const confidenceFieldAction = defineDocumentFieldAction({
  name: 'confidence/proposal',
  useAction({documentId, documentType, path}) {
    // re-evaluate when proposals resolve/regenerate (cheap, deterministic —
    // no memo so the store version doesn't need threading through deps)
    useConfidenceStoreVersion()
    const fieldName = path.length === 1 && typeof path[0] === 'string' ? path[0] : null
    const proposal = fieldName ? getPendingProposal(documentId, documentType, fieldName) : null

    const handleAction = useCallback(() => {
      if (proposal) openProposal(proposal)
    }, [proposal])

    return {
      type: 'action',
      icon: SparklesIcon,
      hidden: !proposal,
      renderAsButton: true,
      onAction: handleAction,
      title: proposal ? `Agent proposal — ${proposal.changeSummary}` : 'Agent proposal',
      tone: 'primary',
    }
  },
})
