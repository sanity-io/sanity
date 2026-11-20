import {viewAsOf} from '../asOf'
import {type History} from '../types'
import {parseAsOf, type ParsedArguments, optionalString, requireString} from './args'
import {type CliDeps, daysBefore, readJson, writeJson} from './deps'

const ISSUES_LOOKBACK_DAYS = 180

export async function loadHistoryFor(
  deps: CliDeps,
  historyPath: string | null,
  issuesFrom: Date,
): Promise<History> {
  return historyPath ? readJson<History>(deps, historyPath) : deps.loadHistory({issuesFrom})
}

export async function runCollect(deps: CliDeps, args: ParsedArguments): Promise<number> {
  const outPath = requireString(args.values, 'out')
  const now = deps.now()
  const asOfOption = optionalString(args.values, 'as-of')
  const asOf = asOfOption ? parseAsOf(asOfOption, now) : now.toISOString()
  const mode = asOfOption ? 'as-of' : 'live'
  const history = await loadHistoryFor(
    deps,
    optionalString(args.values, 'history'),
    daysBefore(new Date(asOf), ISSUES_LOOKBACK_DAYS),
  )
  const evidence = viewAsOf(history, asOf, mode)
  await writeJson(deps, outPath, evidence)
  deps.stdout(
    `Collected ${mode} evidence as of ${asOf}: stable ${evidence.currentStable}, latest ${evidence.latest}, ${evidence.versions.length} newer versions.`,
  )
  return 0
}
