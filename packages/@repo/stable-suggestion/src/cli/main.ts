import {errorMessage} from '../sourced'
import {type CommandName, isCommandName, parseCommandArguments} from './args'
import {runBacktest} from './backtestCommand'
import {runCollect} from './collect'
import {type CliDeps, UsageError} from './deps'
import {runRecommend} from './recommend'
import {runResult} from './resultCommand'
import {runSlackRoute} from './slackRouteCommand'
import {runVerify} from './verifyCommand'

export const USAGE = `Usage: pnpm stable-suggestion <command> [options]

Commands:
  collect      [--as-of <ISO>] --out <evidence.json>
  recommend    <evidence.json> --out-dir <dir> --run-url <url> [--no-llm]
  slack-route  (env HAS_SUGGESTION_WEBHOOK, HAS_CI_ALERTS_WEBHOOK)
  verify       --version <v> --slot <n> --expected-stable <S> [--run-id <id>]
  result       --slot <n> --slot-count <m> --version <v> --previous <S> --outcome <promoted|guard-failed|tag-failed>
               [--guard-reason <reason>] --run-id <id> --run-url <url> --out-dir <dir>
  backtest     [--from <date>] [--to <ISO>] --out <report.md> [--json <file>]
               [--llm-sample <d1,d2,...>] [--max-llm-calls <n>]

Options:
  --help       Show this message

Exit codes: 0 success, 1 failure or guard refused, 2 invalid usage.`

const RUNNERS: Record<
  CommandName,
  (deps: CliDeps, args: ReturnType<typeof parseCommandArguments>) => Promise<number>
> = {
  'collect': runCollect,
  'recommend': runRecommend,
  'slack-route': (deps) => runSlackRoute(deps),
  'verify': runVerify,
  'result': runResult,
  'backtest': runBacktest,
}

export async function runCli(argv: string[], deps: CliDeps): Promise<number> {
  const [command, ...rest] = argv
  if (command === '--help' || command === '-h' || rest.includes('--help')) {
    deps.stdout(USAGE)
    return 0
  }
  if (!isCommandName(command)) {
    deps.stderr(command ? `Unknown command "${command}"` : 'Missing command')
    deps.stderr(USAGE)
    return 2
  }
  try {
    return await RUNNERS[command](deps, parseCommandArguments(command, rest))
  } catch (error) {
    deps.stderr(`${command}: ${errorMessage(error)}`)
    return error instanceof UsageError ? 2 : 1
  }
}
