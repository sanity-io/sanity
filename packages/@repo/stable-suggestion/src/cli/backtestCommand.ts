import {isDeepStrictEqual} from 'node:util'

import {truncateHistory, viewAsOf} from '../asOf'
import {backtestDates} from '../backtest/dates'
import {type LlmNarrative, renderBacktestReport} from '../backtest/report'
import {type BacktestInput, scoreBacktest} from '../backtest/score'
import {BACKTEST_FROM, getModel} from '../config'
import {askModel, summariseHardReasons, toRecommendation} from '../model'
import {buildPrompt} from '../prompt'
import {evaluate} from '../rules'
import {type Evaluation, type Evidence, type History, type IsoDate} from '../types'
import {optionalString, parseInstant, type ParsedArguments, requireString} from './args'
import {loadHistoryFor} from './collect'
import {type CliDeps, daysBefore, UsageError, writeJson} from './deps'

const DEFAULT_MAX_LLM_CALLS = 4
const NOTE_FLAGS = ['open-investigation', 'open-issue-reports', 'sqrl-drop']
const ISSUES_LOOKBACK_DAYS = 90

interface DateResult {
  input: BacktestInput
  evidence: Evidence
  evaluation: Evaluation
}

interface ModelSample {
  pick: string | null
  narrative: LlmNarrative | null
  note: string
}

function holdNote(evaluation: Evaluation): string[] {
  return evaluation.shortlist.length > 0 ? [] : [`hold: ${summariseHardReasons(evaluation)}`]
}

function flagNotes(evaluation: Evaluation): string[] {
  return evaluation.candidates
    .filter((candidate) => evaluation.shortlist.includes(candidate.version))
    .flatMap((candidate) =>
      candidate.soft
        .filter((verdict) => NOTE_FLAGS.includes(verdict.code))
        .map((verdict) => `${candidate.version}: ${verdict.code}`),
    )
}

function evaluateDate(history: History, asOf: IsoDate): DateResult {
  const evidence = viewAsOf(history, asOf, 'as-of')
  const evaluation = evaluate(evidence)
  const truncated = viewAsOf(truncateHistory(history, asOf), asOf, 'as-of')
  const leakageOk = isDeepStrictEqual(evidence, truncated)
  return {
    evidence,
    evaluation,
    input: {
      asOf,
      currentStable: evidence.currentStable,
      eligibleCount: evaluation.eligible.length,
      shortlist: evaluation.shortlist,
      leakageOk,
      notes: [...holdNote(evaluation), ...flagNotes(evaluation)],
    },
  }
}

export function resolveSampleDates(sample: string | null, dates: IsoDate[]): IsoDate[] {
  if (sample === null) return []
  return sample
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const match = dates.find((date) => date.startsWith(entry))
      if (match) return match
      throw new UsageError(`--llm-sample date ${entry} is not a backtest date`)
    })
}

function parseMaxCalls(value: string | null): number {
  if (value === null) return DEFAULT_MAX_LLM_CALLS
  const count = Number(value)
  if (Number.isInteger(count) && count >= 0) return count
  throw new UsageError(`--max-llm-calls must be a non-negative integer, got "${value}"`)
}

async function sampleModel(deps: CliDeps, result: DateResult): Promise<ModelSample> {
  const answer = await askModel(
    deps.createModelClient(),
    buildPrompt(result.evidence, result.evaluation),
  )
  const recommendation = toRecommendation(answer, result.evaluation, getModel())
  if (recommendation.source !== 'model') {
    return {pick: null, narrative: null, note: `model fallback: ${recommendation.fallbackReason}`}
  }
  const pick =
    recommendation.decision === 'promote' ? (recommendation.shortlist[0]?.version ?? null) : null
  return {
    pick,
    note: pick ? '' : 'model: hold',
    narrative: {
      asOf: result.input.asOf,
      pick: pick ?? 'hold',
      narrative: `${recommendation.headline} ${recommendation.rationale}`.trim(),
    },
  }
}

export async function runBacktest(deps: CliDeps, args: ParsedArguments): Promise<number> {
  const outPath = requireString(args.values, 'out')
  const jsonPath = optionalString(args.values, 'json')
  const now = deps.now()
  const from = parseInstant(optionalString(args.values, 'from') ?? BACKTEST_FROM, 'from')
  const to = parseInstant(optionalString(args.values, 'to') ?? now.toISOString(), 'to')
  const maxCalls = parseMaxCalls(optionalString(args.values, 'max-llm-calls'))
  const history = await loadHistoryFor(
    deps,
    optionalString(args.values, 'history'),
    daysBefore(new Date(from), ISSUES_LOOKBACK_DAYS),
  )
  const dates = backtestDates(from, to)
  const sampleDates = resolveSampleDates(optionalString(args.values, 'llm-sample'), dates)
  const results = dates.map((asOf) => evaluateDate(history, asOf))
  const canSample = Boolean(deps.env.ANTHROPIC_API_KEY)
  const sampled = canSample
    ? results.filter((result) => sampleDates.includes(result.input.asOf)).slice(0, maxCalls)
    : []
  const samples = await sampled.reduce<Promise<Map<IsoDate, ModelSample>>>(
    async (previous, result) => {
      const collected = await previous
      return result.evaluation.eligible.length === 0
        ? collected
        : new Map(collected).set(result.input.asOf, await sampleModel(deps, result))
    },
    Promise.resolve(new Map()),
  )
  const inputs = results.map(({input}) => {
    const sample = samples.get(input.asOf)
    return sample
      ? {...input, modelPick: sample.pick, notes: [...input.notes, sample.note].filter(Boolean)}
      : input
  })
  const evidenceByDate = Object.fromEntries(
    results.map(({input, evidence}) => [input.asOf, evidence]),
  )
  const score = scoreBacktest(inputs, evidenceByDate, history)
  const narratives = [...samples.values()].flatMap(({narrative}) => (narrative ? [narrative] : []))
  await deps.files.writeText(
    outPath,
    `${renderBacktestReport(score, {generatedAt: now.toISOString(), narratives})}\n`,
  )
  if (jsonPath) await writeJson(deps, jsonPath, {score, narratives})
  deps.stdout(
    `Backtest over ${dates.length} dates. P1 ${score.p1.pass ? 'pass' : 'FAIL'}, P2 ${score.p2.pass ? 'pass' : 'FAIL'}, P3 ${score.p3.pass ? 'pass' : 'FAIL'}.`,
  )
  if (sampleDates.length > 0 && !canSample)
    deps.stdout('LLM samples skipped: no ANTHROPIC_API_KEY.')
  return 0
}
