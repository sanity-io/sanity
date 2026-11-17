// Product copy review for locale resource changes.
//
// Diffs the en-US locale resource files between two git refs, runs the copy rules on every added
// or changed string, optionally asks a model for suggestions, and prints a markdown report.
// Exits 0 unless `--strict` is passed and a rule with `error` severity hit.
//
//   node packages/@repo/oxlint-plugin-i18n/src/copy-review/cli.ts --base origin/main [--head HEAD]
//     [--output report.md] [--strict] [--no-llm]
//
// The diff runs from the merge base of `--base` and `--head` to `--head`, so the report covers
// what the branch changed, whatever has landed on the base since.
import {execFileSync} from 'node:child_process'
import {writeFileSync} from 'node:fs'
import {parseArgs} from 'node:util'

import {
  diffLocaleStrings,
  LOCALE_RESOURCE_PATHSPECS,
  type LocaleChange,
  parseLocaleStrings,
} from './extract.ts'
import {reviewWithLlm} from './llm.ts'
import {countHits, renderReport, type ReviewedChange} from './report.ts'
import {checkChange} from './rules.ts'

function git(args: string[]): string {
  return execFileSync('git', args, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024})
}

function readAt(ref: string, file: string): string {
  try {
    return git(['show', `${ref}:${file}`])
  } catch {
    // The file does not exist at that ref (added on this branch)
    return ''
  }
}

async function main(): Promise<void> {
  const {values} = parseArgs({
    options: {
      'base': {type: 'string', default: 'origin/main'},
      'head': {type: 'string', default: 'HEAD'},
      'output': {type: 'string'},
      'strict': {type: 'boolean', default: false},
      'no-llm': {type: 'boolean', default: false},
    },
  })
  const head = values.head
  const base = git(['merge-base', values.base, head]).trim()
  const files = git([
    'diff',
    '--name-only',
    '--diff-filter=AM',
    base,
    head,
    '--',
    ...LOCALE_RESOURCE_PATHSPECS,
  ])
    .split('\n')
    .filter(Boolean)

  const reviewed: ReviewedChange[] = []
  for (const file of files) {
    const before = parseLocaleStrings(readAt(base, file), file)
    const after = parseLocaleStrings(readAt(head, file), file)
    for (const change of diffLocaleStrings(file, before, after)) {
      reviewed.push({change, hits: checkChange(change, {siblings: after})})
    }
  }

  const changes: LocaleChange[] = reviewed.map(({change}) => change)
  const apiKey = process.env['ANTHROPIC_API_KEY']
  let llm: string
  if (values['no-llm']) {
    llm = '_Skipped (`--no-llm`)._'
  } else if (!apiKey) {
    llm = '_Skipped: `ANTHROPIC_API_KEY` is not set._'
  } else if (changes.length === 0) {
    llm = '_Skipped: nothing to review._'
  } else {
    try {
      llm = await reviewWithLlm(changes, {apiKey})
    } catch (error) {
      llm = `_The model review did not run: ${error instanceof Error ? error.message : String(error)}._`
    }
  }

  const report = renderReport({
    reviewed,
    llm,
    range: `${base.slice(0, 10)}..${values.head}`,
  })
  if (values.output) writeFileSync(values.output, report)
  process.stdout.write(report)

  if (values.strict && countHits(reviewed).errors > 0) process.exitCode = 1
}

await main()
