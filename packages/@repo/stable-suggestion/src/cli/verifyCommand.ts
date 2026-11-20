import {viewAsOf} from '../asOf'
import {evaluate} from '../rules'
import {errorMessage} from '../sourced'
import {type Approval, type Evaluation, type GuardReason, type Sourced} from '../types'
import {checkPromotion} from '../verify'
import {
  GUARD_REASONS,
  optionalString,
  parseRunId,
  parseSlot,
  parseVersion,
  type ParsedArguments,
  requireString,
} from './args'
import {loadHistoryFor} from './collect'
import {type CliDeps, daysBefore} from './deps'
import {appendGithubOutput, matchesOneOf} from './outputs'

interface LiveCheck {
  currentStable: string | null
  evaluation: Sourced<Evaluation>
}

async function evaluateLive(deps: CliDeps, historyPath: string | null): Promise<LiveCheck> {
  const now = deps.now()
  try {
    const history = await loadHistoryFor(deps, historyPath, daysBefore(now, 1))
    const evidence = viewAsOf(history, now.toISOString(), 'live')
    const evaluation = evaluate(evidence)
    const radarDown = evidence.regressions.status === 'unavailable'
    return {
      currentStable: evidence.currentStable,
      evaluation: radarDown
        ? {status: 'unavailable', error: 'Radar regression data is unavailable'}
        : {status: 'ok', data: evaluation},
    }
  } catch (error) {
    return {
      currentStable: null,
      evaluation: {status: 'unavailable', error: errorMessage(error)},
    }
  }
}

async function loadApprovals(deps: CliDeps, runId: string | null): Promise<Approval[] | null> {
  if (runId === null) return null
  try {
    return await deps.fetchApprovals(runId)
  } catch {
    return []
  }
}

export async function runVerify(deps: CliDeps, args: ParsedArguments): Promise<number> {
  const version = parseVersion(requireString(args.values, 'version'), 'version')
  const slot = parseSlot(requireString(args.values, 'slot'), 'slot')
  const expectedStable = parseVersion(
    requireString(args.values, 'expected-stable'),
    'expected-stable',
  )
  const runIdOption = optionalString(args.values, 'run-id')
  const runId = runIdOption ? parseRunId(runIdOption) : null
  const live = await evaluateLive(deps, optionalString(args.values, 'history'))
  const approvals = await loadApprovals(deps, runId)
  const reason: GuardReason | null = checkPromotion({
    approvals,
    currentStable: live.currentStable ?? expectedStable,
    expectedStable,
    slot,
    version,
    evaluation: live.evaluation,
  })
  if (reason === null) {
    deps.stdout(`Clear to promote ${version} (slot ${slot}).`)
    return 0
  }
  await appendGithubOutput(deps, [
    {name: 'reason', value: reason, isValid: matchesOneOf(GUARD_REASONS)},
  ])
  deps.stderr(`Guard failed for ${version} (slot ${slot}): ${reason}`)
  return 1
}
