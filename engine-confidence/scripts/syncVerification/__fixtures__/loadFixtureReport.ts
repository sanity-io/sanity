import {readFileSync} from 'node:fs'
import path from 'node:path'

import {type GeneratorReport, parseGeneratorReport} from '../contracts'

const FIXTURE_REPORT_PATH = path.join(import.meta.dirname, 'generator-report.json')

export function loadFixtureReport(): GeneratorReport {
  return parseGeneratorReport(readFileSync(FIXTURE_REPORT_PATH, 'utf8'))
}
