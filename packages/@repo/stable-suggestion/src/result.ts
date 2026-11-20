import {TEXT_LIMITS} from './config'
import {escapeSlack, singleLine, workflowLink} from './render'
import {type Approval, type GuardReason, type PromotionOutcome} from './types'

export interface ResultInput {
  slot: number
  slotCount: number
  version: string
  previous: string
  outcome: PromotionOutcome
  guardReason?: GuardReason | null
  hardReasons?: string[]
  approval: Approval
  runUrl: string
}

function describeGuardReason(
  reason: GuardReason | null | undefined,
  hardReasons: string[],
): string {
  switch (reason) {
    case 'multiple-slots-approved':
      return 'more than one slot was approved in this run'
    case 'stable-moved':
      return 'stable changed since the shortlist was made'
    case 'not-eligible':
      return hardReasons.length > 0
        ? `the version is no longer eligible (${escapeSlack(hardReasons.join('; '), 300)})`
        : 'the version is no longer eligible'
    case 'data-unavailable':
      return 'could not re-check Radar or npm'
    case 'slot-not-approved':
      return "this slot's approval could not be confirmed"
    default:
      return 'a safety check failed'
  }
}

function describeApprover(approval: Approval): string {
  return `@${escapeSlack(approval.login, 80)}`
}

function describeComment(approval: Approval): string {
  const comment = escapeSlack(singleLine(approval.comment), TEXT_LIMITS.comment)
  return comment.length > 0 ? `: “${comment}”` : ''
}

export function buildResultText(input: ResultInput): string {
  const version = escapeSlack(input.version, 40)
  const previous = escapeSlack(input.previous, 40)
  const position = `${input.slot} of ${input.slotCount}`
  const link = workflowLink(input.runUrl)
  if (input.outcome === 'promoted') {
    return `:white_check_mark: *sanity ${version} is now @stable* (was ${previous}). Slot ${position}, approved by ${describeApprover(input.approval)}${describeComment(input.approval)}. ${link}`
  }
  if (input.outcome === 'guard-failed') {
    const reason = describeGuardReason(input.guardReason, input.hardReasons ?? [])
    return `:no_entry: Did not promote sanity ${version} (slot ${position}): ${reason}. Nothing was tagged. The other slots in this run remain open. Approved by ${describeApprover(input.approval)}. ${link}`
  }
  return `:rotating_light: Promoting sanity ${version} (slot ${position}) failed while tagging. Some packages or the bundle manifest may already point at it; rerun failed jobs or run \`gh workflow run tag-stable.yml -f version=${version}\`. Approved by ${describeApprover(input.approval)}. ${link}`
}
