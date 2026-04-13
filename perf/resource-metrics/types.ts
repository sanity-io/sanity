import {type Page} from 'playwright'

export interface Scenario {
  name: string
  description: string
  getUrl: (baseUrl: string, ...args: string[]) => string
  waitForReady: (page: Page) => Promise<void>
}

export interface ResourceMetrics {
  /** Total number of HTTP requests made */
  httpRequestCount: number
  /** Total bytes transferred across all HTTP responses */
  httpTransferBytes: number
  /** Number of DOM nodes in the document */
  domNodeCount: number
  /** Number of JS event listeners attached */
  jsEventListenerCount: number
  /** JS heap size in bytes after forced GC */
  jsHeapUsedBytes: number
}

export interface RequestEntry {
  url: string
  method: string
  resourceType: string
  responseStatus: number
  transferSize: number
}

export interface ScenarioResult {
  scenario: string
  metrics: ResourceMetrics
  requests: RequestEntry[]
  timestamp: string
  commitSha: string
}

export interface ComparisonResult {
  scenario: string
  reference: ResourceMetrics
  experiment: ResourceMetrics
  delta: Record<keyof ResourceMetrics, {absolute: number; percent: number}>
}

/** Sanity document written to the metrics dataset for time-series tracking */
export interface ResourceMetricsDocument {
  _type: 'resourceMetrics'
  commitSha: string
  branch: string
  timestamp: string
  scenarios: Array<{
    _key: string
    name: string
    metrics: ResourceMetrics
    requests: RequestEntry[]
  }>
}
