import {type ReleaseDocument} from '@sanity/client'

import {useReleaseAgentTextAction} from './useReleaseAgentTextAction'

const SUMMARY_INSTRUCTION = [
  'You are given $changes — an array of documents being modified in a content release.',
  'Each element has _type, before (the currently published version, or null if new), and after (the in-release version).',
  'When after._system.delete === true, the document is being unpublished.',
  '',
  'Produce a release summary with two parts:',
  '',
  '1. A single sentence describing what this release achieves overall — the editorial intent or user-facing outcome readers will perceive. Frame it in narrative terms, not mechanics (avoid phrases like "X documents were updated").',
  '',
  '2. Then 2-4 short bullet lines, each starting with "- ", naming the affected document by its title and describing the substantive content change (added / edited / unpublished, and what is different in the content). Skip metadata churn.',
  '',
  'Plain text only. Do not use markdown headings. Separate the overview sentence from the bullet list with a blank line.',
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
