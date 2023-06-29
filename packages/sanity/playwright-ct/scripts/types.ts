export interface JSONReportCustom {
  config: Config
  suites: Suite[]
  errors: any[]
}

export interface Config {
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

export interface Metadata {
  totalTime: number
}

export interface Project {
  outputDir: string
  repeatEach: number
  retries: number
  id: ID
  name: ID
  testDir: string
  testIgnore: any[]
  testMatch: string[]
  timeout: number
}

export enum ID {
  ChromeLatestWindows11 = 'chrome@latest:Windows 11',
  PlaywrightFirefoxWindows11 = 'playwright-firefox:Windows 11',
  PlaywrightWebkitLatestOSXVentura = 'playwright-webkit@latest:OSX Ventura',
}

export interface ReportSlowTests {
  max: number
  threshold: number
}

export interface ReporterClass {
  outputFolder?: string
  outputFile?: string
}

export interface Suite {
  title: string
  file: File
  column: number
  line: number
  specs: Spec[]
  suites?: Suite[]
}

export enum File {
  FormBuilderSpecTsx = 'FormBuilder.spec.tsx',
}

export interface Spec {
  title: string
  ok: boolean
  tags: any[]
  tests: Test[]
  id: string
  file: File
  line: number
  column: number
}

export interface Test {
  timeout: number
  annotations: Annotation[]
  expectedStatus: ExpectedStatusEnum
  projectId: ID
  projectName: ID
  results: Result[]
  status: PurpleStatus
}

export interface Annotation {
  type: string
  description: string
}

export enum ExpectedStatusEnum {
  Passed = 'passed',
  Skipped = 'skipped',
  Failed = 'failed',
}

export interface Result {
  workerIndex: number
  status: ExpectedStatusEnum
  duration: number
  errors: any[]
  stdout: any[]
  stderr: any[]
  retry: number
  startTime: Date
  attachments: any[]
}

export enum PurpleStatus {
  Expected = 'expected',
  Skipped = 'skipped',
  Failed = 'failed',
}

type GroupedTest = {
  test: Test
  duration: number
  status: ExpectedStatusEnum | 'failed'
  error: string // the first error
}

type SpecSummary = {
  totalDuration: number
  totalSkipped: number
  totalFailed: number
  totalPassed: number
  totalTests: number
}

type GroupedSpec = {
  summary: SpecSummary
  projects: {
    [project: string]: GroupedTest[]
  }
}

export type GroupedTests = {
  [suite: string]: {
    [spec: string]: GroupedSpec
  }
}

export interface SummaryRow {
  file: string
  totalDuration: number
  totalPassed: number
  totalSkipped: number
  totalFailed: number
  status: string
}
