import {getModel, SHORTLIST_SIZE} from '../config'
import {askModel, deterministicRecommendation, toRecommendation} from '../model'
import {buildPrompt} from '../prompt'
import {
  renderShortlistText,
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
import {parseRunUrl, type ParsedArguments, requireString} from './args'
import {type CliDeps, readJson, writeJson} from './deps'
import {
  appendGithubOutput,
  matchesOneOf,
  matchesSemver,
  matchesSemverOrEmpty,
  matchesSlotCount,
  type OutputEntry,
} from './outputs'

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

export function toRecommendOutputs(recommendation: Recommendation): OutputEntry[] {
  const slotEntries = Array.from({length: SHORTLIST_SIZE}, (_unused, index) => ({
    name: `slot-${index + 1}`,
    value: recommendation.shortlist[index]?.version ?? '',
    isValid: matchesSemverOrEmpty,
  }))
  return [
    {name: 'baseline', value: recommendation.evaluation.currentStable, isValid: matchesSemver},
    {
      name: 'slot-count',
      value: String(recommendation.shortlist.length),
      isValid: matchesSlotCount,
    },
    ...slotEntries,
    {name: 'decision', value: recommendation.decision, isValid: matchesOneOf(['promote', 'hold'])},
  ]
}

export async function runRecommend(deps: CliDeps, args: ParsedArguments): Promise<number> {
  const [evidencePath] = args.positionals
  if (!evidencePath) {
    deps.stderr('Missing <evidence.json> argument')
    return 2
  }
  const outDir = requireString(args.values, 'out-dir')
  const runUrl = parseRunUrl(requireString(args.values, 'run-url'))
  const evidence = await readJson<Evidence>(deps, evidencePath)
  const evaluation = evaluate(evidence)
  const recommendation = await recommendFor(deps, args, evidence, evaluation)
  const text = renderShortlistText(recommendation, evidence, runUrl)
  await writeJson(deps, `${outDir}/recommendation.json`, recommendation)
  await writeJson(deps, `${outDir}/slack-webhook.json`, toWebhookPayload(text, runUrl))
  await writeJson(deps, `${outDir}/slack-fallback.json`, toFallbackPayload(text))
  await deps.files.writeText(
    `${outDir}/summary.md`,
    `${renderSummaryMarkdown(recommendation, evidence, runUrl)}\n`,
  )
  await appendGithubOutput(deps, toRecommendOutputs(recommendation))
  deps.stdout(
    `Decision ${recommendation.decision} (${recommendation.source}${recommendation.fallbackReason ? `: ${recommendation.fallbackReason}` : ''}). Shortlist: ${recommendation.shortlist.map((entry) => entry.version).join(', ') || 'none'}.`,
  )
  return 0
}
