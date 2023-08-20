#!/usr/bin/env node -r esbuild-register

import {writeFileSync} from 'fs'
import {inspect} from 'util'
import path from 'path'
import _ from 'lodash'
import {readJsonFile, generateOutput, groupTests} from './utils'

const DEBUG = Boolean(parseInt(process.env.DEBUG || '0', 2))
const DEFAULT_ARTIFACT_OUTPUT_PATH = path.resolve(path.join(__dirname, '..', 'results'))

/**
 * Summarize the Playwright report JSON into a Markdown string that can be posted as a comment to PRs
 */
function main() {
  const workflowUrl = process.env.GITHUB_WORKFLOW_URL || ''
  const jsonPath =
    process.env.REPORT_JSON_PATH! ||
    path.join(DEFAULT_ARTIFACT_OUTPUT_PATH, 'playwright-ct-test-results.json')
  const testOutput = readJsonFile(jsonPath)

  if (testOutput) {
    const groups = groupTests(testOutput)
    const markdownTable = generateOutput(groups, workflowUrl)

    if (DEBUG) {
      const result = inspect(groups, {
        depth: Infinity,
        breakLength: 80,
        colors: true,
      })
      // eslint-disable-next-line no-console
      console.log(result)
      // eslint-disable-next-line no-console
      console.log(markdownTable)
    }

    writeFileSync(
      path.join(DEFAULT_ARTIFACT_OUTPUT_PATH, 'playwright-report-pr-comment.md'),
      markdownTable,
      'utf8',
    )
  }

  process.stdout.write('Processing Playwright report JSON complete\n')
}

main()
