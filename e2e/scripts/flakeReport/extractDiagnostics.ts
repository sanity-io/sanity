/**
 * Runs in CI right after `playwright test`. Pulls the diagnostics captures of every test
 * that failed at least once out of ./blob-report and writes them to ./diagnostics so the
 * e2e workflow can upload them as a small `e2e-diagnostics-<project>-<shard>` artifact.
 * The flake report (index.ts) reads those instead of the video-heavy shard artifacts.
 */
import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

import {extractTestCaptures, keepTestsWithFailures, readBlobReportZip} from './blobReport'

const BLOB_REPORT_DIR = 'blob-report'
const OUTPUT_DIR = 'diagnostics'

async function main(): Promise<void> {
  let zips: string[]
  try {
    zips = (await readdir(BLOB_REPORT_DIR)).filter((file) => file.endsWith('.zip'))
  } catch {
    console.error(`No ${BLOB_REPORT_DIR}/ directory; nothing to extract.`)
    return
  }

  for (const zip of zips) {
    // oxlint-disable-next-line no-await-in-loop -- a shard has one blob report; sequential is fine
    const jsonl = readBlobReportZip(new Uint8Array(await readFile(path.join(BLOB_REPORT_DIR, zip))))
    const tests = keepTestsWithFailures(extractTestCaptures(jsonl))
    if (tests.length === 0) {
      console.error(`${zip}: no failed attempts, nothing to write.`)
      continue
    }
    // oxlint-disable-next-line no-await-in-loop -- see above
    await mkdir(OUTPUT_DIR, {recursive: true})
    const outFile = path.join(OUTPUT_DIR, zip.replace(/\.zip$/, '.json'))
    // oxlint-disable-next-line no-await-in-loop -- see above
    await writeFile(outFile, JSON.stringify({tests}, null, 2))
    const attempts = tests.reduce((sum, test) => sum + test.attempts.length, 0)
    console.error(`${zip}: wrote ${tests.length} tests / ${attempts} attempts to ${outFile}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error)
  process.exitCode = 1
})
