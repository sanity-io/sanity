import {type LocaleChange} from './extract.ts'
import {type RuleHit} from './rules.ts'

export interface ReviewedChange {
  change: LocaleChange
  hits: RuleHit[]
}

export interface ReportInput {
  reviewed: ReviewedChange[]
  /** Markdown from the LLM pass, or a one-line note saying why it did not run */
  llm: string
  range: string
}

/** Inline code that survives backticks inside the value */
function code(value: string): string {
  const fence = value.includes('`') ? '``' : '`'
  const padded = value.startsWith('`') || value.endsWith('`') ? ` ${value} ` : value
  return `${fence}${padded.replace(/\n/g, '⏎')}${fence}`
}

function renderChange({change, hits}: ReviewedChange): string {
  const lines = [`#### ${code(change.key)} (${change.kind})`, '']
  if (change.comment) lines.push(`_Where it appears:_ ${change.comment}`, '')
  if (change.oldValue !== undefined) lines.push(`- Before: ${code(change.oldValue)}`)
  lines.push(`- After: ${code(change.newValue)}`)
  for (const hit of hits) {
    const icon = hit.severity === 'error' ? '❌' : '⚠️'
    lines.push(`- ${icon} **${hit.rule}**: ${hit.message} _Suggestion:_ ${hit.suggestion}`)
  }
  return lines.join('\n')
}

export function countHits(reviewed: ReviewedChange[]): {errors: number; warnings: number} {
  let errors = 0
  let warnings = 0
  for (const {hits} of reviewed) {
    for (const hit of hits) {
      if (hit.severity === 'error') errors++
      else warnings++
    }
  }
  return {errors, warnings}
}

export function renderReport({reviewed, llm, range}: ReportInput): string {
  const files = [...new Set(reviewed.map(({change}) => change.file))]
  const {errors, warnings} = countHits(reviewed)
  const out = [
    '## ✍️ Product copy review',
    '',
    `${reviewed.length} added or changed string${reviewed.length === 1 ? '' : 's'} in ${files.length} locale file${files.length === 1 ? '' : 's'} (${range}) · ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`,
    '',
    '> Non-blocking. The rules are pattern checks: treat a hit as a prompt to reread the string, not as a verdict.',
  ]
  if (reviewed.length === 0) {
    out.push('', 'No added or changed English strings.')
    return `${out.join('\n')}\n`
  }
  for (const file of files) {
    const inFile = reviewed.filter(({change}) => change.file === file)
    const flagged = inFile.filter(({hits}) => hits.length > 0)
    const clean = inFile.filter(({hits}) => hits.length === 0)
    out.push('', `### ${code(file)}`)
    for (const item of flagged) out.push('', renderChange(item))
    if (clean.length > 0) {
      out.push(
        '',
        `<details><summary>${clean.length} string${clean.length === 1 ? '' : 's'} with no rule hits</summary>`,
        '',
        ...clean.map((item) => renderChange(item)).flatMap((block) => [block, '']),
        '</details>',
      )
    }
  }
  out.push('', '### 🤖 Suggestions from the model', '', llm)
  return `${out.join('\n')}\n`
}
