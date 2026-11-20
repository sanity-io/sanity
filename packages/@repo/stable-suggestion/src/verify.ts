import {type Approval, type Evaluation, type GuardReason, type Sourced} from './types'

export interface PromotionCheckInput {
  approvals: Approval[] | null
  currentStable: string
  expectedStable: string
  slot: number
  version: string
  evaluation: Sourced<Evaluation>
}

function approvedSlots(approvals: Approval[]): number[] {
  const slots = approvals
    .filter((approval) => approval.state === 'approved')
    .flatMap((approval) => approval.slots)
  return [...new Set(slots)]
}

function checkApprovals(approvals: Approval[], slot: number): GuardReason | null {
  const slots = approvedSlots(approvals)
  if (slots.length > 1) return 'multiple-slots-approved'
  return slots[0] === slot ? null : 'slot-not-approved'
}

export function checkPromotion(input: PromotionCheckInput): GuardReason | null {
  const approvalReason = input.approvals ? checkApprovals(input.approvals, input.slot) : null
  if (approvalReason) return approvalReason
  if (input.currentStable === input.expectedStable) {
    if (input.evaluation.status === 'unavailable') return 'data-unavailable'
    return input.evaluation.data.eligible.includes(input.version) ? null : 'not-eligible'
  }
  return 'stable-moved'
}
