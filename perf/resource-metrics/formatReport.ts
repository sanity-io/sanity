import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {EXACT_METRICS, TOLERANT_METRICS} from './compare'
import {type ComparisonResult, type ResourceMetrics} from './types'

const METRIC_LABELS: Record<keyof ResourceMetrics, {label: string; format: (v: number) => string}> =
  {
    httpRequestCount: {label: 'HTTP Requests', format: (v) => String(v)},
    httpTransferBytes: {label: 'Transfer Size', format: formatBytes},
    domNodeCount: {label: 'DOM Nodes', format: (v) => String(v)},
    jsEventListenerCount: {label: 'Event Listeners', format: (v) => String(v)},
    jsHeapUsedBytes: {label: 'JS Heap (after GC)', format: formatBytes},
  }

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDelta(absolute: number, percent: number, format: (v: number) => string): string {
  if (absolute === 0) return '-'
  const sign = absolute > 0 ? '+' : '-'
  const pctStr = isFinite(percent) ? ` (${sign}${Math.abs(percent * 100).toFixed(1)}%)` : ''
  return `${sign}${format(Math.abs(absolute))}${pctStr}`
}

function statusIcon(key: keyof ResourceMetrics, absolute: number, percent: number): string {
  if (absolute <= 0) return '✅'
  if (EXACT_METRICS.includes(key)) return '🔴'
  const tolerance = TOLERANT_METRICS[key]
  if (tolerance !== undefined && percent > tolerance) return '🔴'
  return '✅'
}

export function formatMarkdownReport(comparisons: ComparisonResult[]): string {
  let md = `### 📊 Resource Metrics Report\n\n`
  md += `Updated ${new Date().toUTCString()}\n\n`

  for (const comparison of comparisons) {
    md += `#### ${comparison.scenario}\n\n`
    md += `| Metric | reference | experiment | Δ | |\n`
    md += `| :-- | --: | --: | --: | --- |\n`

    for (const [key, config] of Object.entries(METRIC_LABELS)) {
      const metricKey = key as keyof ResourceMetrics
      const refVal = comparison.reference[metricKey]
      const expVal = comparison.experiment[metricKey]
      const {absolute, percent} = comparison.delta[metricKey]

      md +=
        `| ${config.label} ` +
        `| ${config.format(refVal)} ` +
        `| ${config.format(expVal)} ` +
        `| ${formatDelta(absolute, percent, config.format)} ` +
        `| ${statusIcon(metricKey, absolute, percent)} ` +
        `|\n`
    }
    md += '\n'
  }

  md += `<details>\n<summary><strong>Request breakdown</strong></summary>\n\n`
  md += `See the full request list in the CI artifacts.\n\n`
  md += `</details>\n`

  return md
}

// When run directly, read results from disk and write the markdown report
const workspaceDir = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const reportDir = path.join(workspaceDir, 'results', 'report')
  const files = await fs.promises.readdir(reportDir)
  const jsonFiles = files.filter((f) => f.endsWith('.json'))

  if (jsonFiles.length === 0) {
    throw new Error(`No JSON files found in ${reportDir}`)
  }

  const comparisons: ComparisonResult[] = []
  for (const file of jsonFiles) {
    const content = await fs.promises.readFile(path.join(reportDir, file), 'utf-8')
    comparisons.push(...JSON.parse(content))
  }

  const markdown = formatMarkdownReport(comparisons)
  const outputPath = path.join(workspaceDir, 'results', 'resource-metrics-report.md')
  await fs.promises.writeFile(outputPath, markdown)
}

void main()
