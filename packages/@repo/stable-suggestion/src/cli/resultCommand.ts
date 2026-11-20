import {toFallbackPayload, toWebhookPayload} from '../render'
import {buildResultText} from '../result'
import {type Approval} from '../types'
import {
  optionalString,
  parseCount,
  parseGuardReason,
  parseOutcome,
  parseRunId,
  parseRunUrl,
  parseSlot,
  parseVersion,
  type ParsedArguments,
  requireString,
} from './args'
import {type CliDeps, writeJson} from './deps'

function unknownApproval(slot: number): Approval {
  return {login: 'unknown', comment: '', state: 'approved', slots: [slot]}
}

async function findApproval(deps: CliDeps, runId: string, slot: number): Promise<Approval> {
  try {
    const approvals = await deps.fetchApprovals(runId)
    const forSlot = approvals.filter(
      (approval) => approval.state === 'approved' && approval.slots.includes(slot),
    )
    return forSlot.at(-1) ?? unknownApproval(slot)
  } catch {
    return unknownApproval(slot)
  }
}

export async function runResult(deps: CliDeps, args: ParsedArguments): Promise<number> {
  const slotCount = parseCount(requireString(args.values, 'slot-count'), 'slot-count')
  const slot = parseSlot(requireString(args.values, 'slot'), 'slot')
  const version = parseVersion(requireString(args.values, 'version'), 'version')
  const previous = parseVersion(requireString(args.values, 'previous'), 'previous')
  const outcome = parseOutcome(requireString(args.values, 'outcome'))
  const guardOption = optionalString(args.values, 'guard-reason')
  const runId = parseRunId(requireString(args.values, 'run-id'))
  const runUrl = parseRunUrl(requireString(args.values, 'run-url'))
  const outDir = requireString(args.values, 'out-dir')
  const approval = await findApproval(deps, runId, slot)
  const text = buildResultText({
    slot,
    slotCount,
    version,
    previous,
    outcome,
    guardReason: guardOption ? parseGuardReason(guardOption) : null,
    approval,
    runUrl,
  })
  await writeJson(deps, `${outDir}/slack-webhook.json`, toWebhookPayload(text, runUrl))
  await writeJson(deps, `${outDir}/slack-fallback.json`, toFallbackPayload(text))
  deps.stdout(`Result message written for ${version} (${outcome}).`)
  return 0
}
