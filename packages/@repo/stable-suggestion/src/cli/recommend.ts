import {getModel} from '../config'
import {askModel, deterministicRecommendation, toRecommendation} from '../model'
import {buildPrompt} from '../prompt'
import {
  renderShortlist,
  renderSummaryMarkdown,
  toFallbackPayload,
  toWebhookPayload,
} from '../render'
import {evaluate} from '../rules'
import {
  type Evaluation,
  type Evidence,
  type ModelFailureReason,
  type Recommendation,
} from '../types'
import {parseHttpUrl, type ParsedArguments, requireString} from './args'
import {type CliDeps, readJson, writeJson} from './deps'

function skipReason(
  deps: CliDeps,
  args: ParsedArguments,
  evaluation: Evaluation,
): ModelFailureReason | null {
  if (args.values['no-llm'] === true) return 'disabled'
  if (!deps.env.ANTHROPIC_API_KEY) return 'no-api-key'
  return evaluation.eligible.length === 0 ? 'no-eligible-versions' : null
}

async function recommendFor(
  deps: CliDeps,
  args: ParsedArguments,
  evidence: Evidence,
  evaluation: Evaluation,
): Promise<Recommendation> {
  const reason = skipReason(deps, args, evaluation)
  if (reason) return deterministicRecommendation(evaluation, reason)
  const answer = await askModel(deps.createModelClient(), buildPrompt(evidence, evaluation))
  return toRecommendation(answer, evaluation, getModel())
}

export async function runRecommend(deps: CliDeps, args: ParsedArguments): Promise<number> {
  const [evidencePath] = args.positionals
  if (!evidencePath) {
    deps.stderr('Missing <evidence.json> argument')
    return 2
  }
  const outDir = requireString(args.values, 'out-dir')
  const runUrl = parseHttpUrl(requireString(args.values, 'run-url'), 'run-url')
  const workflowUrl = parseHttpUrl(requireString(args.values, 'workflow-url'), 'workflow-url')
  const links = {runUrl, workflowUrl}
  const evidence = await readJson<Evidence>(deps, evidencePath)
  const evaluation = evaluate(evidence)
  const recommendation = await recommendFor(deps, args, evidence, evaluation)
  const message = renderShortlist(recommendation, evidence, links)
  await writeJson(deps, `${outDir}/recommendation.json`, recommendation)
  await writeJson(deps, `${outDir}/slack-webhook.json`, toWebhookPayload(message, workflowUrl))
  await writeJson(deps, `${outDir}/slack-fallback.json`, toFallbackPayload(message))
  await deps.files.writeText(
    `${outDir}/summary.md`,
    `${renderSummaryMarkdown(recommendation, evidence, links)}\n`,
  )
  deps.stdout(
    `Decision ${recommendation.decision} (${recommendation.source}${recommendation.fallbackReason ? `: ${recommendation.fallbackReason}` : ''}). Shortlist: ${recommendation.shortlist.map((entry) => entry.version).join(', ') || 'none'}.`,
  )
  return 0
}
