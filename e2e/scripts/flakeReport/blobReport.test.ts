import {strToU8, zipSync} from 'fflate'
import {describe, expect, it} from 'vitest'

import {extractTestCaptures, keepTestsWithFailures, readBlobReportsFromArtifact} from './blobReport'

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')

const jsonl = [
  {
    method: 'onProject',
    params: {
      project: {
        suites: [
          {
            entries: [
              {
                entries: [
                  {testId: 't-restore', title: 'restore actions should not leak'},
                  {testId: 't-green', title: 'unrelated passing test'},
                ],
                title: 'document-actions',
              },
            ],
            title: 'restore.spec.ts',
          },
        ],
      },
    },
  },
  {
    method: 'onTestEnd',
    params: {result: {id: 'r1', status: 'failed'}, test: {testId: 't-restore'}},
  },
  {
    method: 'onAttach',
    params: {
      attachments: [
        {
          base64: encode({diagnosticVersion: 1, network: {shard: 'gcp-eu'}}),
          contentType: 'application/json',
          name: 'studio-diagnostics.json',
        },
        {contentType: 'video/webm', name: 'video', path: 'video.webm'},
      ],
      resultId: 'r1',
      testId: 't-restore',
    },
  },
  {
    method: 'onTestEnd',
    params: {result: {id: 'r2', status: 'failed'}, test: {testId: 't-restore'}},
  },
  {
    method: 'onAttach',
    params: {
      attachments: [
        {
          base64: encode({fallbackVersion: 1, probes: []}),
          contentType: 'application/json',
          name: 'studio-diagnostics-fallback.json',
        },
      ],
      resultId: 'r2',
      testId: 't-restore',
    },
  },
  {
    method: 'onTestEnd',
    params: {result: {id: 'r3', status: 'passed'}, test: {testId: 't-restore'}},
  },
  {method: 'onTestEnd', params: {result: {id: 'r4', status: 'passed'}, test: {testId: 't-green'}}},
]
  .map((event) => JSON.stringify(event))
  .join('\n')

describe('extractTestCaptures', () => {
  it('correlates attempts with their diagnostics attachments and resolves titles', () => {
    const tests = extractTestCaptures(jsonl)

    expect(tests.map((test) => test.title)).toEqual([
      'restore.spec.ts › document-actions › restore actions should not leak',
      'restore.spec.ts › document-actions › unrelated passing test',
    ])
    const [restore] = tests
    expect(
      restore.attempts.map((attempt) => [attempt.attempt, attempt.status, attempt.kind]),
    ).toEqual([
      [1, 'failed', 'studio'],
      [2, 'failed', 'fallback'],
      [3, 'passed', 'none'],
    ])
    expect(restore.attempts[0].diagnostics).toMatchObject({network: {shard: 'gcp-eu'}})
    expect(restore.attempts[1].fallback).toMatchObject({fallbackVersion: 1})
  })

  it('drops tests that never failed for the compact diagnostics artifact', () => {
    const kept = keepTestsWithFailures(extractTestCaptures(jsonl))
    expect(kept.map((test) => test.title)).toEqual([
      'restore.spec.ts › document-actions › restore actions should not leak',
    ])
  })
})

describe('readBlobReportsFromArtifact', () => {
  it('finds report.jsonl inside the blob zips of an artifact, skipping other files', () => {
    const blobZip = zipSync({
      'report.jsonl': strToU8(jsonl),
      'resources/trace.zip': strToU8('binary'),
    })
    const artifact = zipSync({
      'blob-report/report-chromium-1.zip': blobZip,
      'results/test-a/video.webm': strToU8('not a zip'),
    })

    const reports = readBlobReportsFromArtifact(artifact)
    expect(reports).toHaveLength(1)
    expect(extractTestCaptures(reports[0])).toHaveLength(2)
  })
})
