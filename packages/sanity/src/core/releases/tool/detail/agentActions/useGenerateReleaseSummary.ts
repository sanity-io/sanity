import {type ReleaseDocument} from '@sanity/client'

import {useReleaseAgentTextAction} from './useReleaseAgentTextAction'

const SUMMARY_INSTRUCTION = [
  '$changes is an array of documents that this release modifies.',
  'Each element has _type, before (the published version, or null if new), and after (the version in this release).',
  'If after._system.delete is true, the document will be unpublished.',
  '',
  'Produce a release summary in two parts:',
  '',
  '1. One sentence naming what this release achieves — what readers will see. Avoid count-and-mechanics phrasing like "X documents were updated".',
  '',
  '2. Then 2-4 bullet lines, each starting with "- ". Each names the document by title and states what changed (added, edited, or unpublished, plus what is different). Skip metadata churn.',
  '',
  'Plain text. No markdown headings. Separate the overview sentence from the bullets with a blank line.',
].join('\n')

function mergeSummaryIntoMetadata(
  metadata: ReleaseDocument['metadata'],
  generated: string,
): ReleaseDocument['metadata'] {
  const merged = metadata.description ? `${metadata.description}\n\n${generated}` : generated
  return {...metadata, description: merged}
}

export function useGenerateReleaseSummary(release: ReleaseDocument) {
  return useReleaseAgentTextAction({
    release,
    instruction: SUMMARY_INSTRUCTION,
    mergeIntoMetadata: mergeSummaryIntoMetadata,
  })
}
