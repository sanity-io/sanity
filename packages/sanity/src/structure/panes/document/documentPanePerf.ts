const DOCUMENT_PANE_PROVIDER_RENDER_MEASURE = 'sanity.documentPaneProvider.render'
const DOCUMENT_PANE_PROVIDER_RENDER_MEASURE_LEGACY = 'documentPaneProvider'
const DOCUMENT_PANE_SUBTREE_RENDER_MEASURE = 'sanity.documentPane'
const DOCUMENT_PANE_PROVIDER_DEV_PERF_API_KEY = '__sanityDocumentPanePerf'
const MAX_PERF_SAMPLES = 200
const MAX_SLOWEST_SAMPLES = 5
const IS_DEV = process.env.NODE_ENV !== 'production'

type ProfilerPhase = 'mount' | 'update' | 'nested-update'

interface DevPerfRecord {
  pane: string
  paneKey: string
  phase: ProfilerPhase
  actualDuration: number
  baseDuration: number
  measureDuration: number
  startTime: number
  commitTime: number
}

interface SlowRenderSample {
  phase: ProfilerPhase
  actualDuration: number
  baseDuration: number
  measureDuration: number
  startTime: number
  commitTime: number
}

interface PanePerfStats {
  pane: string
  paneKey: string
  count: number
  phaseCounts: Record<ProfilerPhase, number>
  totalActualDuration: number
  totalMeasureDuration: number
  maxActualDuration: number
  maxMeasureDuration: number
  recentActualDurations: number[]
  slowestRenders: SlowRenderSample[]
}

interface PanePerfSummary extends Omit<PanePerfStats, 'recentActualDurations'> {
  avgActualDuration: number
  avgMeasureDuration: number
  p95ActualDuration: number
}

interface DocumentPanePerfApi {
  record: (entry: DevPerfRecord) => void
  snapshot: () => PanePerfSummary[]
  pane: (pane?: string) => PanePerfSummary | undefined
  reset: () => void
}

interface ReportDocumentPaneRenderPerformanceParams {
  paneKeyForPerf: string
  renderMeasureName: string
  phase: ProfilerPhase
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
}

export function getDocumentPaneRenderMeasureName(paneKey: string | undefined) {
  const paneKeyForPerf = paneKey || 'unknown'
  return {
    paneKeyForPerf,
    renderMeasureName: `${DOCUMENT_PANE_PROVIDER_RENDER_MEASURE}.${paneKeyForPerf}`,
  }
}

export function getDocumentPaneSubtreeRenderMeasureName(
  scope: string,
  paneKey: string | undefined,
) {
  const paneKeyForPerf = paneKey || 'unknown'
  return {
    paneKeyForPerf,
    renderMeasureName: `${DOCUMENT_PANE_SUBTREE_RENDER_MEASURE}.${scope}.${paneKeyForPerf}`,
  }
}

export function reportDocumentPaneRenderPerformance(
  params: ReportDocumentPaneRenderPerformanceParams,
) {
  const {
    paneKeyForPerf,
    renderMeasureName,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  } = params
  if (!canMeasurePerformance()) return

  const perfApi = getDocumentPanePerfApi()
  if (perfApi) {
    perfApi.record({
      pane: renderMeasureName,
      paneKey: paneKeyForPerf,
      phase,
      actualDuration,
      baseDuration,
      measureDuration: commitTime - startTime,
      startTime,
      commitTime,
    })
  }

  try {
    performance.measure(DOCUMENT_PANE_PROVIDER_RENDER_MEASURE_LEGACY, {
      start: startTime,
      end: commitTime,
      detail: {phase, actualDuration, baseDuration, paneKey: paneKeyForPerf},
    })
    performance.measure(renderMeasureName, {
      start: startTime,
      end: commitTime,
      detail: {phase, actualDuration, baseDuration},
    })
  } catch {
    performance.mark(`${renderMeasureName}.${phase}`, {
      detail: {actualDuration, baseDuration, startTime, commitTime},
    })
  }
}

function toPanePerfSummary(stats: PanePerfStats): PanePerfSummary {
  return {
    ...stats,
    avgActualDuration: stats.count ? stats.totalActualDuration / stats.count : 0,
    avgMeasureDuration: stats.count ? stats.totalMeasureDuration / stats.count : 0,
    p95ActualDuration: calculateQuantile(stats.recentActualDurations, 0.95),
  }
}

function createPanePerfStats(pane: string, paneKey: string): PanePerfStats {
  return {
    pane,
    paneKey,
    count: 0,
    phaseCounts: {'mount': 0, 'update': 0, 'nested-update': 0},
    totalActualDuration: 0,
    totalMeasureDuration: 0,
    maxActualDuration: 0,
    maxMeasureDuration: 0,
    recentActualDurations: [],
    slowestRenders: [],
  }
}

function calculateQuantile(values: number[], quantile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.floor((sorted.length - 1) * quantile)
  return sorted[index]
}

function addSlowestRender(stats: PanePerfStats, sample: SlowRenderSample) {
  stats.slowestRenders.push(sample)
  stats.slowestRenders.sort((a, b) => b.actualDuration - a.actualDuration)
  if (stats.slowestRenders.length > MAX_SLOWEST_SAMPLES) {
    stats.slowestRenders.length = MAX_SLOWEST_SAMPLES
  }
}

function isDocumentPanePerfApi(value: unknown): value is DocumentPanePerfApi {
  if (!value || typeof value !== 'object') return false

  const maybePerfApi = value as Partial<DocumentPanePerfApi>
  return (
    typeof maybePerfApi.record === 'function' &&
    typeof maybePerfApi.snapshot === 'function' &&
    typeof maybePerfApi.pane === 'function' &&
    typeof maybePerfApi.reset === 'function'
  )
}

function getDocumentPanePerfApi(): DocumentPanePerfApi | undefined {
  if (!IS_DEV || typeof globalThis === 'undefined') return undefined

  const globalRecord = globalThis as Record<string, unknown>
  const existing = globalRecord[DOCUMENT_PANE_PROVIDER_DEV_PERF_API_KEY]
  if (isDocumentPanePerfApi(existing)) return existing

  const byPane = new Map<string, PanePerfStats>()
  let latestPane: string | undefined

  const perfApi: DocumentPanePerfApi = {
    record: (entry) => {
      const existingPaneStats = byPane.get(entry.pane)
      const stats = existingPaneStats || createPanePerfStats(entry.pane, entry.paneKey)

      stats.count += 1
      stats.phaseCounts[entry.phase] += 1
      stats.totalActualDuration += entry.actualDuration
      stats.totalMeasureDuration += entry.measureDuration
      stats.maxActualDuration = Math.max(stats.maxActualDuration, entry.actualDuration)
      stats.maxMeasureDuration = Math.max(stats.maxMeasureDuration, entry.measureDuration)
      stats.recentActualDurations.push(entry.actualDuration)
      if (stats.recentActualDurations.length > MAX_PERF_SAMPLES) {
        stats.recentActualDurations.shift()
      }

      addSlowestRender(stats, {
        phase: entry.phase,
        actualDuration: entry.actualDuration,
        baseDuration: entry.baseDuration,
        measureDuration: entry.measureDuration,
        startTime: entry.startTime,
        commitTime: entry.commitTime,
      })

      if (!existingPaneStats) {
        byPane.set(entry.pane, stats)
      }
      latestPane = entry.pane
    },
    snapshot: () =>
      [...byPane.values()]
        .map(toPanePerfSummary)
        .sort((a, b) => b.maxActualDuration - a.maxActualDuration),
    pane: (pane) => {
      const summaries = perfApi.snapshot()
      if (summaries.length === 0) return undefined

      if (pane) {
        return summaries.find((summary) => summary.pane === pane)
      }

      if (latestPane) {
        const latest = summaries.find((summary) => summary.pane === latestPane)
        if (latest) return latest
      }

      return summaries.find((summary) => summary.pane.includes('.documentEditor-')) || summaries[0]
    },
    reset: () => {
      byPane.clear()
      latestPane = undefined
    },
  }

  globalRecord[DOCUMENT_PANE_PROVIDER_DEV_PERF_API_KEY] = perfApi
  return perfApi
}

function canMeasurePerformance() {
  return (
    typeof performance !== 'undefined' &&
    typeof performance.mark === 'function' &&
    typeof performance.measure === 'function'
  )
}
