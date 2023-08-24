enum ExpectedStatus {
  Passed = 'passed',
  Skipped = 'skipped',
  Failed = 'failed',
}

enum TestStatus {
  Expected = 'expected',
  Skipped = 'skipped',
  Failed = 'failed',
}

export interface Annotation {
  type: string
  description: string
}

interface Config {
  configFile: string
  rootDir: string
  forbidOnly: boolean
  fullyParallel: boolean
  globalSetup: string
  globalTeardown: string
  globalTimeout: number
  grep: null
  grepInvert: null
  maxFailures: number
  metadata: Metadata
  preserveOutput: string
  reporter: Array<Array<ReporterClass | null | string>>
  reportSlowTests: ReportSlowTests
  quiet: boolean
  projects: Project[]
  shard: null
  updateSnapshots: string
  version: string
  workers: number
  webServer: null
}

export type GroupedSpec = {
  summary: SpecSummary
  projects: {
    [project: string]: GroupedTest[]
  }
}

type GroupedTest = {
  test: Test
  duration: number
  status: ExpectedStatus | 'failed'
  error: string // the first error
}

export type GroupedTests = {
  [suite: string]: {
    [spec: string]: GroupedSpec
  }
}

export interface JSONReportCustom {
  config: Config
  suites: Suite[]
  errors: any[]
}

interface Metadata {
  totalTime: number
}

interface Project {
  outputDir: string
  repeatEach: number
  retries: number
  id: string
  name: string
  testDir: string
  testIgnore: any[]
  testMatch: string[]
  timeout: number
}

interface ReporterClass {
  outputFolder?: string
  outputFile?: string
}

interface ReportSlowTests {
  max: number
  threshold: number
}

interface Result {
  workerIndex: number
  status: ExpectedStatus
  duration: number
  errors: any[]
  stdout: any[]
  stderr: any[]
  retry: number
  startTime: Date
  attachments: any[]
}

export interface Spec {
  title: string
  ok: boolean
  tags: any[]
  tests: Test[]
  id: string
  file: string
  line: number
  column: number
}

export interface SummaryRow {
  file: string
  totalDuration: number
  totalFailed: number
  totalSkipped: number
  totalPassed: number
  status: string
}

type SpecSummary = Omit<SummaryRow, 'file' | 'status'> & {
  totalTests: number
}

export interface Suite {
  title: string
  file: File
  column: number
  line: number
  specs: Spec[]
  suites?: Suite[]
}

interface Test {
  timeout: number
  annotations: Annotation[]
  expectedStatus: ExpectedStatus
  projectId: string
  projectName: string
  results: Result[]
  status: TestStatus
}
